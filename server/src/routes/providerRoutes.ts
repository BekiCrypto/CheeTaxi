import { Router } from 'express';
import { ProviderAggregatorService } from '../services/providerAggregatorService.js';
import { AggregatorProviderId } from '../../../shared/types.js';

export const providerRouter = Router();

/**
 * Normalized multi-provider search & ranking
 */
providerRouter.post('/offers', (req, res) => {
  const { pickup, destination, category = 'sedan' } = req.body;
  if (!pickup || !destination) {
    return res.status(400).json({ error: 'Pickup and destination are required' });
  }

  const offers = ProviderAggregatorService.searchAndRankOffers(pickup, destination, category);
  return res.json({ offers });
});

/**
 * Provider adapter status & circuit breaker health
 */
providerRouter.get('/status', (req, res) => {
  const statuses = ProviderAggregatorService.getProviderStatuses();
  return res.json({ providers: statuses });
});

/**
 * Simulate or test circuit breaker trip
 */
providerRouter.post('/circuit/trip', (req, res) => {
  const { providerId } = req.body;
  if (!providerId) return res.status(400).json({ error: 'providerId is required' });

  // Record 3 failures to trip circuit OPEN
  ProviderAggregatorService.recordProviderFailure(providerId as AggregatorProviderId);
  ProviderAggregatorService.recordProviderFailure(providerId as AggregatorProviderId);
  ProviderAggregatorService.recordProviderFailure(providerId as AggregatorProviderId);

  return res.json({
    success: true,
    message: `Provider ${providerId} circuit breaker tripped OPEN for fail-safe testing.`,
  });
});

/**
 * Reset circuit breaker
 */
providerRouter.post('/circuit/reset', (req, res) => {
  const { providerId } = req.body;
  if (!providerId) return res.status(400).json({ error: 'providerId is required' });

  ProviderAggregatorService.resetProviderCircuit(providerId as AggregatorProviderId);
  return res.json({
    success: true,
    message: `Provider ${providerId} circuit reset to CLOSED.`,
  });
});
