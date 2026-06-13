import 'server-only';
import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// Default model for text-based tasks (free-text estimate, advice): cheapest, good quality.
export const MODEL = 'claude-haiku-4-5';
// Photo analysis benefits from stronger vision/portion reasoning — worth the extra cost.
export const VISION_MODEL = 'claude-sonnet-4-6';
