import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storage } from '../lib/storage.js';
import { createTeam, createRosterSlot, createPerson } from '../lib/models.js';

export default function ManageTeams() {
  const [teams, setTeams] = useState([]);
  const [slots, setSlots] = useState([]);
  const [people, setPeople] = useState([]);
  const [games, setGames] = useState([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [newNumber, setNewNumber] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');

  useEffect(() => {
    setTeams(storage.getTeams());
    setSlots(storage.getRosterSlots());
    setPeople(storage.getPeople());
    setGames(storage.getGames());
  }, []);

  function addTeam() {
    if (!newTeamName.trim()) return;
    const team = createTeam(newTeamName.trim());
    const updated = [...teams, team];
    setTeams(updated);
    storage.saveTeams(updated);
    setNewTeamName('');
  }

  function addRosterSlot(teamId) {
    if (!newNumber.trim()) return;
    let personId = null;
    let updatedPeople = people;
    // Naming a player here is captain self-attestation, not a real
    // account - good enough for MVP, see the "linking players" discussion.
    if (newPlayerName.trim()) {
      const person = createPerson(newPlayerName.trim());
      updatedPeople = [...people, person];
      personId = person.id;
    }
    const slot = createRosterSlot({ teamId, number: newNumber.trim(), personId });
    const updatedSlots = [...slots, slot];
    setSlots(updatedSlots);
    setPeople(updatedPeople);
    storage.saveRosterSlots(updatedSlots);
    storage.savePeople(updatedPeople);
    setNewNumber('');
    setNewPlayerName('');
  }

  function handleLogoUpload(teamId, file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Downscale to keep the base64 string small - localStorage has a
        // few MB ceiling total, and full-size photos eat it fast.
        const maxDim = 128;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');

        const updated = teams.map((t) => (t.id === teamId ? { ...t, logo: dataUrl } : t));
        setTeams(updated);
        storage.saveTeams(updated);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function confirmGame(gameId) {
    const updated = games.map((g) => (g.id === gameId ? { ...g, status: 'confirmed' } : g));
    setGames(updated);
    storage.saveGames(updated);
  }

  const pendingForSelected = games.filter(
    (g) => g.status === 'pending_confirmation' && (g.teamAId === selectedTeamId || g.teamBId === selectedTeamId)
  );

  return (
    <div className="stack">
      <Link to="/">&larr; Home</Link>
      <h2>Manage teams</h2>

      <div className="stack" style={{ padding: 0, flexDirection: 'row' }}>
        <input value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="New team name" />
        <button onClick={addTeam}>Create</button>
      </div>

      {teams.map((team) => (
        <div key={team.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: 12 }}>
          <button
            onClick={() => setSelectedTeamId(team.id === selectedTeamId ? null : team.id)}
            style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent', padding: 0, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {team.logo && <img src={team.logo} alt="" style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'cover' }} />}
            {team.name}
          </button>

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
              {slots.filter((s) => s.teamId === team.id).map((s) => {
                const person = people.find((p) => p.id === s.personId);
                return (
                  <div key={s.id}>
                    #{s.number} {person ? person.name : '(number tracked, no name on file yet)'}
                  </div>
                );
              })}
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={newNumber} onChange={(e) => setNewNumber(e.target.value)} placeholder="Jersey #" />
                <input value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Name (optional)" />
              </div>
              <button onClick={() => addRosterSlot(team.id)}>Add to roster</button>

              {pendingForSelected.length > 0 && (
                <div className="stack" style={{ padding: 0 }}>
                  <h4 style={{ margin: 0 }}>Pending games to review</h4>
                  {pendingForSelected.map((g) => (
                    <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{g.teamAName || 'Team A'} vs {g.teamBName || 'Team B'}: {g.scoreA}-{g.scoreB}</span>
                      <button onClick={() => confirmGame(g.id)}>Confirm</button>
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
