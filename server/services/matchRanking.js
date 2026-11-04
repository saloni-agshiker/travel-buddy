const DAY_MS = 24 * 60 * 60 * 1000;

function normalise(value) {
  return String(value || "").trim().toLowerCase();
}

function locationsFor(trip) {
  return [normalise(trip.depAirport), normalise(trip.arrAirport)].filter(Boolean);
}

function sharedLocationCount(candidateTrip, trips) {
  const candidateLocations = new Set(locationsFor(candidateTrip));
  const userLocations = new Set(trips.flatMap(locationsFor));
  return [...candidateLocations].filter((location) => userLocations.has(location)).length;
}

function closestUpcomingTripDays(candidateTrip, upcomingTrips) {
  const candidateDate = new Date(candidateTrip.depAt).getTime();
  if (!Number.isFinite(candidateDate) || upcomingTrips.length === 0) return null;

  return Math.min(
    ...upcomingTrips.map((trip) => Math.abs(candidateDate - new Date(trip.depAt).getTime()) / DAY_MS)
  );
}

// Scores one trip against the signed-in traveller's profile and trip history.
// The highest scoring trip is used as the representative trip for each person.
function scoreTrip(candidateTrip, { upcomingTrips, previousTrips, currentResidence, candidateResidence }) {
  const reasons = [];
  let score = 0;

  const upcomingLocationMatches = sharedLocationCount(candidateTrip, upcomingTrips);
  if (upcomingLocationMatches) {
    score += upcomingLocationMatches * 20;
    reasons.push("shared upcoming location");
  }

  const previousLocationMatches = sharedLocationCount(candidateTrip, previousTrips);
  if (previousLocationMatches) {
    score += previousLocationMatches * 10;
    reasons.push("shared travel history");
  }

  if (normalise(currentResidence) && normalise(currentResidence) === normalise(candidateResidence)) {
    score += 15;
    reasons.push("same current location");
  }

  const daysApart = closestUpcomingTripDays(candidateTrip, upcomingTrips);
  if (daysApart !== null) {
    if (daysApart <= 1) score += 25;
    else if (daysApart <= 3) score += 20;
    else if (daysApart <= 7) score += 15;
    else if (daysApart <= 14) score += 8;
    else if (daysApart <= 30) score += 3;

    if (daysApart <= 30) reasons.push("similar travel dates");
  }

  return { score, reasons, daysApart: daysApart ?? Number.POSITIVE_INFINITY };
}

function rankUniqueTravellers(trips, context) {
  const bestTripByUser = new Map();

  for (const trip of trips) {
    if (!trip.userId?._id) continue;
    const match = scoreTrip(trip, {
      ...context,
      candidateResidence: trip.userId.residence,
    });
    const candidate = { ...trip, matchScore: match.score, matchReasons: match.reasons, _daysApart: match.daysApart };
    const userId = String(trip.userId._id);
    const existing = bestTripByUser.get(userId);

    if (
      !existing ||
      candidate.matchScore > existing.matchScore ||
      (candidate.matchScore === existing.matchScore && candidate._daysApart < existing._daysApart) ||
      (candidate.matchScore === existing.matchScore && candidate._daysApart === existing._daysApart &&
        new Date(candidate.depAt) < new Date(existing.depAt))
    ) {
      bestTripByUser.set(userId, candidate);
    }
  }

  return [...bestTripByUser.values()]
    .sort((a, b) => b.matchScore - a.matchScore || a._daysApart - b._daysApart || new Date(a.depAt) - new Date(b.depAt))
    .map(({ _daysApart, ...trip }) => trip);
}

module.exports = { rankUniqueTravellers, scoreTrip };
