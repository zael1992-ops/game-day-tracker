import { useState, useEffect } from 'react';
import AppScreen from '../components/AppScreen.jsx';
import TeamLogo from '../components/TeamLogo.jsx';
import { PencilIcon, CloseIcon } from '../components/Icons.jsx';
import {
  listTeams,
  insertTeam,
  updateTeamLogo,
  deleteTeam,
  updateTeamName,
  listRosterSlots,
  insertRosterSlot,
  updateRosterSlot,
  deleteRosterSlot,
  updatePersonPhoto,
  listPendingGamesForTeam,
  confirmGame,
  rejectGame,
} from '../lib/dataStore.js';
import { parseRosterPaste } from '../lib/rosterImport.js';
import { useAuth } from '../lib/AuthContext.jsx';

export default function ManageTeams() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTeamName, setNewTeamName] = useState('');
  const [teamNameError, setTeamNameError] = useState('');
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState('');
  const [renameSaved, setRenameSaved] = useState(false);

  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [slots, setSlots] = useState([]);
  const [pendingGames, setPendingGames] = useState([]);
  const [newNumber, setNewNumber] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');

  const [editingSlotId, setEditingSlotId] = useState(null);
  const [editNumber, setEditNumber] = useState('');
  const [editName, setEditName] = useState('');

  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkPreview, setBulkPreview] = useState(null);
  const [bulkImporting, setBulkImporting] = useState(false);

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
    setRenameValue(teams.find((t) => t.id === teamId)?.name || '');
    setRenameError('');
    setRenameSaved(false);
    setEditingSlotId(null);
    setNewNumber('');
    setNewPlayerName('');
    setShowBulkImport(false);
    setBulkText('');
    setBulkPreview(null);
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

  // Renaming updates the team everywhere: past games, stats, and the
  // live hub all read the name from the team itself.
  async function handleRenameTeam(teamId) {
    const trimmed = renameValue.trim();
    const current = teams.find((t) => t.id === teamId);
    if (!trimmed) {
      setRenameError('Team name can\'t be empty.');
      return;
    }
    if (trimmed === current?.name) return;
    const duplicate = teams.some((t) => t.id !== teamId && t.name.toLowerCase() === trimmed.toLowerCase());
    if (duplicate) {
      setRenameError(`A team named "${trimmed}" already exists`);
      return;
    }
    try {
      await updateTeamName(teamId, trimmed);
      setTeams(teams.map((t) => (t.id === teamId ? { ...t, name: trimmed } : t)));
      setRenameValue(trimmed);
      setRenameError('');
      setRenameSaved(true);
    } catch (err) {
      setRenameError(`Couldn't rename the team: ${err.message}`);
    }
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
    const team = teams.find((t) => t.id === teamId);
    const othersTeam = team?.ownerId && user?.id && team.ownerId !== user.id;
    const warning = othersTeam
      ? `${teamName} was created by another account. Delete it anyway? This removes its roster too and can't be undone.`
      : `Delete ${teamName}? This removes its roster too and can't be undone.`;
    if (!window.confirm(warning)) return;
    try {
      await deleteTeam(teamId);
    } catch (err) {
      alert(`Couldn't delete ${teamName}. ${err.message}`);
      return;
    }
    setTeams(teams.filter((t) => t.id !== teamId));
    if (selectedTeamId === teamId) setSelectedTeamId(null);
  }

  async function addRosterSlot(teamId) {
    if (!newNumber.trim()) return;
    try {
      const ownerId = teams.find((t) => t.id === teamId)?.ownerId;
      const slot = await insertRosterSlot({ teamId, ownerId, number: newNumber.trim(), personName: newPlayerName.trim() || null });
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

  function handleBulkParse() {
    const parsed = parseRosterPaste(bulkText);
    setBulkPreview(parsed);
  }

  function removeBulkRow(index) {
    setBulkPreview(bulkPreview.filter((_, i) => i !== index));
  }

  async function handleBulkConfirm(teamId) {
    setBulkImporting(true);
    const ownerId = teams.find((t) => t.id === teamId)?.ownerId;
    const newSlots = [];
    for (const row of bulkPreview) {
      try {
        const slot = await insertRosterSlot({ teamId, ownerId, number: row.number, personName: row.name });
        newSlots.push(slot);
      } catch (err) {
        alert(`Couldn't add #${row.number} ${row.name}: ${err.message}`);
      }
    }
    setSlots([...slots, ...newSlots]);
    setBulkImporting(false);
    setShowBulkImport(false);
    setBulkText('');
    setBulkPreview(null);
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

  const createRow = (
    <div>
      <div className="inline-row">
        <input
          className="field"
          aria-label="New team name"
          value={newTeamName}
          onChange={(e) => { setNewTeamName(e.target.value); setTeamNameError(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') addTeam(); }}
          placeholder="New team name"
        />
        <button type="button" className="btn btn-primary" onClick={addTeam} disabled={!newTeamName.trim()}>Create</button>
      </div>
      {teamNameError && <p className="error-text" style={{ marginTop: 6 }}>{teamNameError}</p>}
    </div>
  );

  return (
    <AppScreen title="Manage Teams">
      {loading && <p className="empty-state">Loading teams...</p>}
      {!loading && teams.length === 0 && <p className="empty-state">No teams yet. Create your first one below.</p>}

      {teams.map((team) => (
        selectedTeamId !== team.id ? (
          <button key={team.id} type="button" className="team-row" onClick={() => selectTeam(team.id)} aria-label={`Edit ${team.name}`}>
            <span className="team-row-name">{team.name}</span>
            <span className="icon-button icon-button-dark"><PencilIcon /></span>
          </button>
        ) : (
          <section key={team.id} className="team-card" aria-label={team.name}>
            <div className="team-card-head">
              <span className="team-row-name">{team.name}</span>
              <button type="button" className="icon-button icon-button-dark" onClick={() => selectTeam(team.id)} aria-label="Close">
                <CloseIcon />
              </button>
            </div>

            <div className="team-card-body">
              <label className="field-label" htmlFor={`team-name-${team.id}`}>Team name</label>
              <div className="inline-row">
                <input
                  id={`team-name-${team.id}`}
                  className="field"
                  value={renameValue}
                  maxLength={40}
                  onChange={(e) => { setRenameValue(e.target.value); setRenameError(''); setRenameSaved(false); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRenameTeam(team.id); }}
                />
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleRenameTeam(team.id)} disabled={renameValue.trim() === team.name}>
                  {renameSaved ? 'Saved' : 'Rename'}
                </button>
              </div>
              {renameError && <p className="error-text">{renameError}</p>}

              <p className="field-label">Logo</p>
              <div className="logo-row">
                <TeamLogo name={team.name} logo={team.logo} size={48} />
                <label className="file-label">
                  {team.logo ? 'Change logo' : 'Add logo'}
                  <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(team.id, e.target.files[0])} />
                </label>
              </div>

              <div className="roster-head">
                <h3 className="section-title" style={{ margin: 0 }}>Roster</h3>
                <span className="muted small">{slots.length} player{slots.length === 1 ? '' : 's'}</span>
              </div>

              {slots.map((s) => (
                editingSlotId === s.id ? (
                  <div key={s.id} className="roster-edit">
                    <div className="inline-row">
                      <input className="field field-sm num-field" aria-label="Jersey number" value={editNumber} onChange={(e) => setEditNumber(e.target.value)} placeholder="#" />
                      <input
                        className="field field-sm"
                        aria-label="Name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Name"
                        disabled={!s.personId}
                        title={!s.personId ? 'Add a name by creating a new roster entry, this one has no linked player yet' : undefined}
                      />
                    </div>
                    {s.personId && (
                      <label className="file-label small">
                        {s.personPhoto ? 'Change photo' : 'Add photo'}
                        <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(s, e.target.files[0])} />
                      </label>
                    )}
                    <div className="btn-row">
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => saveEditSlot(s)}>Save</button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingSlotId(null)}>Cancel</button>
                    </div>
                    <button type="button" className="text-button text-button-danger" style={{ alignSelf: 'flex-start' }} onClick={() => removeSlot(s.id)}>
                      Remove player
                    </button>
                  </div>
                ) : (
                  <div key={s.id} className="roster-row">
                    {s.personPhoto && <img src={s.personPhoto} alt="" className="roster-photo" />}
                    <span className="roster-num">#{s.number}</span>
                    <span className="roster-name">{s.personName || <span className="muted">No name yet</span>}</span>
                    <button type="button" className="icon-button icon-button-dark" onClick={() => startEditSlot(s)} aria-label={`Edit #${s.number}`}>
                      <PencilIcon />
                    </button>
                  </div>
                )
              ))}

              <p className="field-label" style={{ marginTop: 4 }}>Add a player</p>
              <div className="inline-row">
                <input className="field field-sm num-field" aria-label="Jersey number" inputMode="numeric" value={newNumber} onChange={(e) => setNewNumber(e.target.value)} placeholder="#" />
                <input className="field field-sm" aria-label="Player name" value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Name" />
                <button type="button" className="btn btn-primary btn-sm" style={{ minWidth: 72 }} onClick={() => addRosterSlot(team.id)} disabled={!newNumber.trim()}>Add</button>
              </div>

              <p className="field-label" style={{ marginTop: 4 }}>Paste a roster</p>
              {!bulkPreview ? (
                <>
                  <textarea
                    className="field"
                    aria-label="Paste a roster"
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    rows={4}
                    placeholder={'Paste numbers and names, like\n12 Ana 7 Luis 21 Jordi'}
                  />
                  <button type="button" className="btn btn-primary btn-sm" onClick={handleBulkParse} disabled={!bulkText.trim()}>Import players</button>
                </>
              ) : (
                <div className="roster-edit">
                  <p className="small muted">
                    Found {bulkPreview.length} player{bulkPreview.length === 1 ? '' : 's'}. Remove any that look wrong, then add them.
                  </p>
                  {bulkPreview.length === 0 && <p className="error-text">Nothing recognizable in that text. Try pasting again.</p>}
                  {bulkPreview.map((row, i) => (
                    <div key={i} className="roster-row">
                      <span className="roster-num">#{row.number}</span>
                      <span className="roster-name">{row.name}</span>
                      <button type="button" className="icon-button icon-button-dark" onClick={() => removeBulkRow(i)} aria-label={`Remove #${row.number}`}>
                        <CloseIcon size={16} />
                      </button>
                    </div>
                  ))}
                  <div className="btn-row">
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => handleBulkConfirm(team.id)} disabled={bulkPreview.length === 0 || bulkImporting}>
                      {bulkImporting ? 'Adding...' : `Add ${bulkPreview.length} player${bulkPreview.length === 1 ? '' : 's'}`}
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setBulkPreview(null)}>Back</button>
                  </div>
                </div>
              )}

              {pendingGames.length > 0 && (
                <>
                  <h3 className="section-title">Games to Review</h3>
                  {pendingGames.map((g) => (
                    <div key={g.id} className="roster-edit">
                      <strong>{g.teamAName || 'Team A'} {g.scoreA} - {g.scoreB} {g.teamBName || 'Team B'}</strong>
                      <div className="btn-row">
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => handleConfirmGame(g.id)}>Confirm</button>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => handleRejectGame(g.id)}>Reject</button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              <button type="button" className="text-button text-button-danger" style={{ alignSelf: 'flex-start', marginTop: 8 }} onClick={() => handleDeleteTeam(team.id, team.name)}>
                Delete team
              </button>
            </div>
          </section>
        )
      ))}

      {!loading && createRow}
    </AppScreen>
  );
}
