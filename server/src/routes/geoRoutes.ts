import { Router } from 'express';
import {
  ADDIS_LANDMARKS,
  searchAddisPlaces,
  reverseGeocodeAddis,
  generateRouteCoordinates,
  estimateRoadMetrics,
} from '../services/geoService.js';

export const geoRouter = Router();

/**
 * Search places in Addis Ababa
 */
geoRouter.get('/places', (req, res) => {
  const q = req.query.q as string;
  const places = searchAddisPlaces(q || '');
  return res.json({ places });
});

/**
 * Reverse geocode lat/lng to Addis Ababa address
 */
geoRouter.get('/reverse', (req, res) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ error: 'Valid lat and lng query params are required' });
  }

  const location = reverseGeocodeAddis(lat, lng);
  return res.json({ location });
});

/**
 * Get route waypoints and road metrics between two coordinates
 */
geoRouter.get('/route', (req, res) => {
  const startLat = parseFloat(req.query.startLat as string);
  const startLng = parseFloat(req.query.startLng as string);
  const endLat = parseFloat(req.query.endLat as string);
  const endLng = parseFloat(req.query.endLng as string);

  if (isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)) {
    return res.status(400).json({ error: 'Valid start and end coordinates are required' });
  }

  const metrics = estimateRoadMetrics(startLat, startLng, endLat, endLng);
  const waypoints = generateRouteCoordinates(startLat, startLng, endLat, endLng, 25);

  return res.json({
    metrics,
    waypoints,
  });
});
