// This setup file is intended to be used with Vitest's `setupFiles` option
// in vitest.config.js when using the 'jsdom' environment.
// It ensures that global scripts like Battle.js are loaded into the JSDOM context.

// Import order can be important if scripts have dependencies on each other.
// These paths are relative to the project root (d:/github/zia)

// Simulate loading scripts as they would be in a browser
// In a real JSDOM setup with Vitest, you might need to ensure these scripts
// correctly attach to the `window` object provided by JSDOM.

// It's often better if these source files are ES modules that can be imported directly.
// But given their current structure (attaching to window), we rely on them executing.

// Note: Vitest's JSDOM environment provides `window`, `document`, etc.
// When these scripts run, they should populate `window.BattleLogger`, `window.Character`, etc.

import '../src/js/core/battle-logger.js';
import '../src/js/core/skill-loader.js'; // SkillLoader might have its own deps
import '../src/js/core/buff-system.js';  // BuffSystem might have its own deps
import '../src/js/core/character.js';   // Character might have its own deps
import '../src/js/core/job-system.js';  // JobSystem might have its own deps
import '../src/js/core/job-skills.js';  // JobSkills might have its own deps
import '../src/js/core/battle.js';      // This should make window.Battle available

console.log('Test setup file (test/setup.js) executed.');
console.log('Battle object on window after setup:', typeof window.Battle);