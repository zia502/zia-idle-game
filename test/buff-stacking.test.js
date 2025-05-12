import { describe, it, expect, beforeEach, vi } from 'vitest';
import Character from '../src/js/core/character.js';
import BuffSystem from '../src/js/core/buff-system.js';
import BattleLogger from '../src/js/core/battle-logger.js';
// import { SSR_CHARACTERS } from '../src/js/core/gameData.js'; // Assuming gameData.js exports this or similar - File does not exist and variable is unused
// import { SKILLS } from '../src/js/core/skill-loader.js'; // SKILLS is not exported by skill-loader.js and is unused in this file.

// Mock BattleLogger to prevent console output during tests and allow inspection
vi.mock('../src/js/core/battle-logger.js', async () => {
    const imported = await vi.importActual('../src/js/core/battle-logger.js');
    // imported could be the module namespace { default: BattleLoggerObject } or BattleLoggerObject itself.
    const actualBattleLogger = imported.default || imported;

    return { // This object becomes the module's exports.
        default: { // This is what `import BattleLogger from ...` will receive.
            ...(actualBattleLogger || {}), // Spread properties of the original BattleLogger
            log: vi.fn(),                 // Override 'log' with a mock function
            levels: actualBattleLogger && actualBattleLogger.levels ? actualBattleLogger.levels : {} // Keep original levels if they exist
        }
    };
});

// Mock Character._getCharacterTemplate to return a simplified template
vi.mock('../src/js/core/character.js', async () => {
    const actualCharacterModule = await vi.importActual('../src/js/core/character.js');
    const OriginalCharacter = actualCharacterModule.default; // This is the Character object

    // Create a new object that will be the mock.
    // We want to be able to instantiate it with `new Character()` in the test,
    // so the mock itself needs to be a "constructor" or behave like one.
    // Since the original Character is an object with methods, not a class,
    // we will mock its methods on a new object that will be the default export.

    const MockedCharacter = {
        ...OriginalCharacter, // Spread original properties/methods
        characters: {}, // Ensure 'characters' is part of the mock and reset for tests
        // Override _getCharacterTemplate
        _getCharacterTemplate: vi.fn((charInstance) => {
            if (charInstance.id === 'testCharacter_nez') {
                return {
                    id: 'ssr_36',
                    name: '聂查瓦尔皮利',
                    attribute: 'wind',
                    type: 'attack',
                    baseStats: { hp: 3520, attack: 11400, defense: 10, critRate: 0.05, critDamage: 1.5, daRate: 0.1, taRate: 0.05 },
                    skills: ["baZhuangJiaShi", "yiFaJiaShi", "lieFeiJiaShi"]
                };
            }
            return {
                baseStats: { hp: 1000, attack: 100, defense: 10, critRate: 0.05, critDamage: 1.5, daRate: 0.1, taRate: 0.05 },
                skills: []
            };
        }),
        // Override _updateCharacterEffectiveStats
        _updateCharacterEffectiveStats: vi.fn(function(characterId) {
            // 'this' inside this function will refer to MockedCharacter
            const char = this.characters[characterId];
            if (char) {
                char.currentStats = { ...char.baseStats };
            }
        }),
        // Mock the createCharacter method to return a simplified character instance
        // This is what `new Character()` effectively calls in the original code structure
        // if Character was a class. Since it's an object, the test's `new Character`
        // is problematic. The test should ideally call `Character.createCharacter`.
        // However, to make `new Character` work with the mock, we can make the default export
        // a function that mimics a constructor.
    };
    
    // The test uses `new Character(...)`. This implies Character is a constructor.
    // The original `Character` is an object. The `createCharacter` method on the original object
    // is what actually creates character instances.
    // So, the mock's default export should be a function that, when called with `new`,
    // behaves like the original `Character.createCharacter` or a simplified version.

    const MockConstructor = function(id, name, level) {
        // This function will be called by `new Character(...)` in the test.
        // It should return an object that represents a character instance.
        // We'll use a simplified structure for the test instance.
        const charInstance = {
            id: id,
            name: name,
            level: level,
            baseStats: {}, // Will be set in beforeEach
            currentStats: {}, // Will be set in beforeEach
            originalStats: {}, // Will be set in beforeEach
            buffs: [],
            // Add any other properties the test relies on for a character instance
        };
        // Store it in the mock's static `characters` registry if needed by other mocked methods
        MockedCharacter.characters[id] = charInstance;
        return charInstance;
    };

    // Add static methods/properties from MockedCharacter to MockConstructor
    // so that `Character.calculateAttackPower` etc. can be called.
    Object.assign(MockConstructor, MockedCharacter);


    return {
      default: MockConstructor // This will be used for `new Character()`
    };
});


describe('Buff Stacking - Nezahualpilli "一伐架式"', () => {
    let testCharacter;

    beforeEach(() => {
        // Reset mocks if needed
        BattleLogger.log.mockClear();
        Character.characters = {}; // Clear any characters from previous tests

        // Create a new character instance for each test
        testCharacter = new Character('testCharacter_nez', '聂查瓦尔皮利测试', 1); // id, name, level
        testCharacter.baseStats = { attack: 1000, hp: 1000, maxHp: 1000, defense: 100, critRate: 0.05, critDamage: 1.5, daRate: 0.1, taRate: 0.05 };
        testCharacter.currentStats = { ...testCharacter.baseStats };
        testCharacter.originalStats = { ...testCharacter.baseStats }; // For recalculateStatsWithBuffs
        testCharacter.buffs = [];
        Character.characters[testCharacter.id] = testCharacter;

        // Mock necessary global/window objects if BuffSystem or Character methods rely on them
        global.Battle = { // Mock a minimal Battle object if BuffSystem.applyBuff logs to it
            logBattle: vi.fn(),
            currentTurn: 1,
        };
    });

    it('should correctly calculate attack power with a stackable buff and Nezahualpilli s "一伐架式" (non-stackable)', () => {
        // --- Step 1: Apply a generic stackable attack buff ---
        const genericAttackBuff = BuffSystem.createBuff(
            'attackUp', // type
            0.2,        // value (+20%)
            1,          // duration
            { id: 'source_generic', name: 'Generic Buff Source' } // source
        );
        BuffSystem.applyBuff(testCharacter, genericAttackBuff);
        
        // Recalculate stats after applying buff (simplified for test)
        // In a real game, this would be part of a more complex update cycle
        testCharacter.currentStats.attack = Character.calculateAttackPower(testCharacter);
        expect(testCharacter.currentStats.attack).toBe(1200); // 1000 * (1 + 0.2)

        // --- Step 2: Apply "一伐架式" ---
        // Skill data for "一伐架式" (yiFaJiaShi)
        const yiFaJiaShiEffect = {
            type: "attackUp",
            value: 3.0,      // +300%
            duration: 1,
            targetType: "self",
            stackable: false, // Crucial: non-stackable
            dispellable: true
        };

        const yiFaJiaShiBuff = BuffSystem.createBuff(
            yiFaJiaShiEffect.type,
            yiFaJiaShiEffect.value,
            yiFaJiaShiEffect.duration,
            { id: testCharacter.id, name: testCharacter.name }, // Source is self
            { 
                name: '一伐架式', 
                stackable: yiFaJiaShiEffect.stackable,
                description: '自身获得以下强化，持续1回合：攻击力+300%',
                icon: '⚔️🔥' // Example icon
            }
        );
        BuffSystem.applyBuff(testCharacter, yiFaJiaShiBuff);

        // Recalculate attack power
        // The calculateAttackPower function should handle the interaction
        testCharacter.currentStats.attack = Character.calculateAttackPower(testCharacter);

        // Verification based on the logic:
        // Base: 1000
        // Stackable buff (+20%): 1000 * 0.2 = 200. Total = 1200.
        // Non-stackable "一伐架式" (+300%) applies to the 1200: 1200 * (1 + 3.0) = 1200 * 4 = 4800.
        expect(testCharacter.currentStats.attack).toBe(4800);

        // Verify BattleLogger calls for calculation steps (optional, but good for debugging)
        // This requires calculateAttackPower to use BattleLogger.log with CONSOLE_DETAIL
        // For example, expect BattleLogger.log to have been called with details about each buff.
        // console.log(BattleLogger.log.mock.calls); // Inspect calls if needed

        // --- Step 3: Buffs expire (simulate turn end) ---
        BuffSystem.updateBuffDurations(testCharacter); // This will reduce duration and remove if 0
        
        // After "一伐架式" (1 turn) and generic buff (1 turn) expire
        testCharacter.currentStats.attack = Character.calculateAttackPower(testCharacter);
        
        expect(testCharacter.buffs.length).toBe(0); // Both buffs should be gone
        expect(testCharacter.currentStats.attack).toBe(1000); // Back to base attack
    });
});