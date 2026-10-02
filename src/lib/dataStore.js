// Supabase-backed CRUD for every logged-in action. Row Level Security
// (set up in supabase/schema.sql) means every call here is already
// scoped to whoever's logged in - there's no owner_id to manage by
// hand, Postgres enforces it.
//
// Table columns are snake_case, the rest of the app speaks camelCase -
// the mapping functions below are the only place that translation
// happens.

import { supabase } from './supabaseClient.js';

function fromTeamRow(r) {
  return { id: r.id, name: r.name, color: r.color, logo: r.logo };
}

function fromGameRow(r) {
  return {
    id: r.id,
    teamAId: r.team_a_id,
    teamBId: r.team_b_id,
    teamAName: r.team_a_name,
    teamBName: r.team_b_name,
    scoreA: r.score_a,
    scoreB: r.score_b,
    status: r.status,
    createdAt: r.created_at,
  };
}

function fromPlayRow(r) {
  return {
    id: r.id,
    gameId: r.game_id,
    side: r.side,
    type: r.type,
    subType: r.sub_type,
    primaryNumber: r.primary_number,
    secondaryNumber: r.secondary_number,
    primarySlotId: r.primary_slot_id,
    secondarySlotId: r.secondary_slot_id,
    points: r.points,
    sequence: r.sequence,
    isUndone: r.is_undone,
  };
}

function fromSlotRow(r) {
  return { id: r.id, teamId: r.team_id, personId: r.person_id, number: r.number, isCaptain: r.is_captain };
}

function fromPersonRow(r) {
  return { id: r.id, name: r.name };
}

// --- Teams ---------------------------------------------------------
export async function listTeams() {
  const { data, error } = await supabase.from('teams').select('*').order('created_at');
  if (error) throw error;
  return data.map(fromTeamRow);
}

export async function insertTeam(name) {
  const { data, error } = await supabase.from('teams').insert({ name }).select().single();
  if (error) throw error;
  return fromTeamRow(data);
}

export async function updateTeamLogo(teamId, logo) {
  const { error } = await supabase.from('teams').update({ logo }).eq('id', teamId);
  if (error) throw error;
}

export async function deleteTeam(teamId) {
  const { error } = await supabase.from('teams').delete().eq('id', teamId);
  if (error) throw error;
}

// --- People + roster slots -------------------------------------------
export async function listRosterSlots(teamId) {
  const { data, error } = await supabase.from('roster_slots').select('*, people(name, photo)').eq('team_id', teamId);
  if (error) throw error;
  return data.map((r) => ({ ...fromSlotRow(r), personName: r.people?.name ?? null, personPhoto: r.people?.photo ?? null }));
}

export async function insertRosterSlot({ teamId, number, personName }) {
  let personId = null;
  if (personName) {
    const { data: person, error: personError } = await supabase.from('people').insert({ name: personName }).select().single();
    if (personError) throw personError;
    personId = person.id;
  }
  const { data, error } = await supabase
    .from('roster_slots')
    .insert({ team_id: teamId, number, person_id: personId })
    .select('*, people(name, photo)')
    .single();
  if (error) throw error;
  return { ...fromSlotRow(data), personName: data.people?.name ?? null, personPhoto: data.people?.photo ?? null };
}

export async function updatePersonPhoto(personId, photo) {
  const { error } = await supabase.from('people').update({ photo }).eq('id', personId);
  if (error) throw error;
}

export async function updateRosterSlot(slotId, { number, personId, personName }) {
  const { error } = await supabase.from('roster_slots').update({ number }).eq('id', slotId);
  if (error) throw error;
  if (personId && personName) {
    const { error: nameError } = await supabase.from('people').update({ name: personName }).eq('id', personId);
    if (nameError) throw nameError;
  }
}

export async function deleteRosterSlot(slotId) {
  const { error } = await supabase.from('roster_slots').delete().eq('id', slotId);
  if (error) throw error;
}

// --- Games -----------------------------------------------------------
export async function listGames() {
  const { data, error } = await supabase.from('games').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(fromGameRow);
}

export async function getGame(gameId) {
  const { data, error } = await supabase.from('games').select('*').eq('id', gameId).single();
  if (error) throw error;
  return fromGameRow(data);
}

export async function insertGame({ teamAId, teamBId, teamAName, teamBName }) {
  const { data, error } = await supabase
    .from('games')
    .insert({ team_a_id: teamAId, team_b_id: teamBId, team_a_name: teamAName, team_b_name: teamBName })
    .select()
    .single();
  if (error) throw error;
  return fromGameRow(data);
}

export async function updateGameStatus(gameId, status, scoreA, scoreB) {
  const { error } = await supabase.from('games').update({ status, score_a: scoreA, score_b: scoreB }).eq('id', gameId);
  if (error) throw error;
}

export async function confirmGame(gameId) {
  const { error } = await supabase.from('games').update({ status: 'confirmed' }).eq('id', gameId);
  if (error) throw error;
}

export async function rejectGame(gameId) {
  const { error } = await supabase.from('games').update({ status: 'rejected' }).eq('id', gameId);
  if (error) throw error;
}

export async function listPendingGamesForTeam(teamId) {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('status', 'pending_confirmation')
    .or(`team_a_id.eq.${teamId},team_b_id.eq.${teamId}`);
  if (error) throw error;
  return data.map(fromGameRow);
}

export async function listConfirmedGames() {
  const { data, error } = await supabase.from('games').select('*').eq('status', 'confirmed').order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(fromGameRow);
}

// --- Plays -------------------------------------------------------------
export async function listPlays(gameId) {
  const { data, error } = await supabase.from('plays').select('*').eq('game_id', gameId).order('sequence');
  if (error) throw error;
  return data.map(fromPlayRow);
}

export async function listPlaysForGames(gameIds) {
  if (gameIds.length === 0) return [];
  const { data, error } = await supabase.from('plays').select('*').in('game_id', gameIds).eq('is_undone', false);
  if (error) throw error;
  return data.map(fromPlayRow);
}

export async function listConfirmedPlays() {
  const { data: confirmedGames, error: gamesError } = await supabase.from('games').select('id').eq('status', 'confirmed');
  if (gamesError) throw gamesError;
  const ids = confirmedGames.map((g) => g.id);
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from('plays').select('*').in('game_id', ids).eq('is_undone', false);
  if (error) throw error;
  return data.map(fromPlayRow);
}

export async function insertPlay({ gameId, side, type, subType = null, primaryNumber, secondaryNumber = null, points = 0 }) {
  const { data, error } = await supabase
    .from('plays')
    .insert({
      game_id: gameId,
      side,
      type,
      sub_type: subType,
      primary_number: primaryNumber,
      secondary_number: secondaryNumber,
      points,
      sequence: Date.now(),
    })
    .select()
    .single();
  if (error) throw error;
  return fromPlayRow(data);
}

export async function undoPlay(playId) {
  const { error } = await supabase.from('plays').update({ is_undone: true }).eq('id', playId);
  if (error) throw error;
}
