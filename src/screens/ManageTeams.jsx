import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  listTeams,
  insertTeam,
  updateTeamLogo,
  deleteTeam,
  listRosterSlots,
  insertRosterSlot,
  updateRosterSlot,
  deleteRosterSlot,
  updatePersonPhoto,
  listPendingGamesForTeam,
  confirmGame,
  rejectGame,
} from '../lib/dataStore.js';

export default function ManageTeams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTeamName, setNewTeamName] = useState('');
  const [teamNameError, setTeamNameError] = useState('');

  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [slots, setSlots] = useState([]);
  const [pendingGames, setPendingGames] = useState([]);
  const [newNumber, setNewNumber] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');

  const [editingSlotId, setEditingSlotId] = useState(null);
  const [editNumber, setEditNumber] = useState('');
  const [editName, setEditName] = useState('');

  useEffect(() => {
    refreshTeams();
  }, []);

  async function refreshTeams() {
    setLoading(true);
    setTeams(await listTeams());
    setLoading(false);
  }

  async function selectTeam(teamId) {
    if (teamId === selectedTeamId) {
      setSelectedTeamId(null);
      return;
    }
    setSelectedTeamId(teamId);
    setEditingSlotId(null);
    setNewNumber('');
    setNewPlayerName('');
    try {
      setSlots(await listRosterSlots(teamId));
      setPendingGames(await listPendingGamesForTeam(teamId));
    } catch (err) {
      alert(`Couldn't load this team's roster: ${err.message}`);
    }
  }

  async function addTeam() {
    const trimmed = newTeamName.trim();
    if (!trimmed) return;
    const alreadyExists = teams.some((t) => t.name.toLowerCase() === trimmed.toLowerCase());
    if (alreadyExists) {
      setTeamNameError(`A team named "${trimmed}" already exists`);
      return;
    }
    const team = await insertTeam(trimmed);
    setTeams([...teams, team]);
    setNewTeamName('');
    setTeamNameError('');
  }

  function handleLogoUpload(teamId, file) {
    if (!file) return;
    resizeImage(file, 128).then(async (dataUrl) => {
      await updateTeamLogo(teamId, dataUrl);
      setTeams(teams.map((t) => (t.id === teamId ? { ...t, logo: dataUrl } : t)));
    });
  }

  function handlePhotoUpload(slot, file) {
    if (!file || !slot.personId) return;
    resizeImage(file, 128).then(async (dataUrl) => {
      await updatePersonPhoto(slot.personId, dataUrl);
      setSlots(slots.map((s) => (s.id === slot.id ? { ...s, personPhoto: dataUrl } : s)));
    });
  }

  function resizeImage(file, maxDim) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleDeleteTeam(teamId, teamName) {
    if (!window.confirm(`Delete ${teamName}? This removes its roster too and can't be undone.`)) return;
    await deleteTeam(teamId);
    setTeams(teams.filter((t) => t.id !== teamId));
    if (selectedTeamId === teamId) setSelectedTeamId(null);
  }

  async function addRosterSlot(teamId) {
    if (!newNumber.trim()) return;
    try {
      const slot = await insertRosterSlot({ teamId, number: newNumber.trim(), personName: newPlayerName.trim() || null });
      setSlots([...slots, slot]);
      setNewNumber('');
      setNewPlayerName('');
    } catch (err) {
      alert(`Couldn't add that player: ${err.message}`);
    }
  }

  function startEditSlot(slot) {
    setEditingSlotId(slot.id);
    setEditNumber(slot.number);
    setEditName(slot.personName || '');
  }

  async function saveEditSlot(slot) {
    await updateRosterSlot(slot.id, { number: editNumber.trim(), personId: slot.personId, personName: editName.trim() });
    setSlots(slots.map((s) => (s.id === slot.id ? { ...s, number: editNumber.trim(), personName: slot.personId ? editName.trim() : s.personName } : s)));
    setEditingSlotId(null);
  }

  async function removeSlot(slotId) {
    if (!window.confirm('Remove this player from the roster?')) return;
    await deleteRosterSlot(slotId);
    setSlots(slots.filter((s) => s.id !== slotId));
  }

  async function handleConfirmGame(gameId) {
    await confirmGame(gameId);
    setPendingGames(pendingGames.filter((g) => g.id !== gameId));
  }

  async function handleRejectGame(gameId) {
    if (!window.confirm("Reject this game? It won't count toward anyone's stats.")) return;
    await rejectGame(gameId);
    setPendingGames(pendingGames.filter((g) => g.id !== gameId));
  }

  if (loading) return <div className="stack">Loading teams...</div>;

  return (
    <div className="stack">
      <Link to="/home">&larr; Home</Link>
      <h2>Manage teams</h2>

      <div className="stack" style={{ padding: 0 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={newTeamName}
            onChange={(e) => { setNewTeamName(e.target.value); setTeamNameError(''); }}
            placeholder="New team name"
          />
          <button onClick={addTeam}>Create</button>
        </div>
        {teamNameError && <p style={{ color: 'var(--color-danger)', fontSize: 14, margin: 0 }}>{teamNameError}</p>}
      </div>

      {teams.map((team) => (
        <div key={team.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => selectTeam(team.id)}
              style={{ flex: 1, textAlign: 'left', border: 'none', background: 'transparent', padding: 0, display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {team.logo && <img src={team.logo} alt="" style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'cover' }} />}
              {team.name}
            </button>
            <button onClick={() => handleDeleteTeam(team.id, team.name)} aria-label={`Delete ${team.name}`} style={{ padding: '4px 10px' }}>
              &times;
            </button>
          </div>

          {selectedTeamId === team.id && (
            <div className="stack" style={{ padding: '12px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {team.logo && <img src={team.logo} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />}
                <label style={{ fontSize: 14 }}>
                  Team logo
                  <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(team.id, e.target.files[0])} />
                </label>
              </div>

              <h4 style={{ margin: 0 }}>Roster</h4>
              {slots.map((s) => (
                <div key={s.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: 8 }}>
                  {editingSlotId === s.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input value={editNumber} onChange={(e) => setEditNumber(e.target.value)} placeholder="Jersey #" />
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Name"
                          disabled={!s.personId}
                          title={!s.personId ? 'Add a name by creating a new roster entry, this one has no linked player yet' : undefined}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => saveEditSlot(s)} style={{ flex: 1 }}>Save</button>
                        <button onClick={() => setEditingSlotId(null)} style={{ flex: 1 }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar photo={s.personPhoto} number={s.number} />
                      <div style={{ flex: 1 }}>
                        <div>#{s.number} {s.personName || <span style={{ color: 'var(--color-text-muted)' }}>(no name on file yet)</span>}</div>
                        {s.personId && (
                          <label style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                            Photo
                            <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(s, e.target.files[0])} style={{ fontSize: 12 }} />
                          </label>
                        )}
                      </div>
                      <button onClick={() => startEditSlot(s)} style={{ padding: '4px 10px' }}>Edit</button>
                      <button onClick={() => removeSlot(s.id)} aria-label="Remove player" style={{ padding: '4px 10px' }}>&times;</button>
                    </div>
                  )}
                </div>
              ))}

              <div style={{ display: 'flex', gap: 8 }}>
                <input value={newNumber} onChange={(e) => setNewNumber(e.target.value)} placeholder="Jersey #" />
                <input value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Name (optional)" />
              </div>
              <button onClick={() => addRosterSlot(team.id)}>Add to roster</button>

              {pendingGames.length > 0 && (
                <div className="stack" style={{ padding: 0 }}>
                  <h4 style={{ margin: 0 }}>Pending games to review</h4>
                  {pendingGames.map((g) => (
                    <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span>{g.teamAName || 'Team A'} vs {g.teamBName || 'Team B'}: {g.scoreA}-{g.scoreB}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handleConfirmGame(g.id)}>Confirm</button>
                        <button onClick={() => handleRejectGame(g.id)} style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Avatar({ photo, number }) {
  if (photo) {
    return <img src={photo} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />;
  }
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 700,
        color: 'var(--color-text-muted)',
      }}
    >
      #{number}
    </div>
  );
}
