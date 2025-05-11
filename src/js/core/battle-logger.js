/**
 * @file battle-logger.js
 * @description Provides a unified logging system for battle events.
 */

const BattleLogger = {
    levels: {
        CONSOLE_DETAIL: 'CONSOLE_DETAIL', // For detailed console debugging, including calculation processes
        CONSOLE_INFO: 'CONSOLE_INFO',     // For general console information
        BATTLE_LOG: 'BATTLE_LOG'          // For concise battle UI logs, visible to the player
    },

    /**
     * Logs a message with specified level, details, and turn.
     * @param {string} level - The logging level (e.g., BattleLogger.levels.CONSOLE_DETAIL).
     * @param {string} message - The main log message.
     * @param {object|null} details - Optional object containing structured details for CONSOLE_DETAIL.
     *                                Example: { calculation: "Attack Power", steps: ["Base: 100", "Buff: +20"], finalValue: 120 }
     * @param {number|null} turn - Optional current battle turn number for console log prefix.
     */
    log(level, message, details = null, turn = null) {
        const turnPrefix = turn !== null ? `[战斗][回合 ${turn}]` : '[战斗]';

        switch (level) {
            case this.levels.CONSOLE_DETAIL:
                console.log(`${turnPrefix} ${message}`);
                if (details && typeof details === 'object') {
                    if (details.calculation) {
                        console.log(`  ${turnPrefix}  计算详情: ${details.calculation}`);
                    }
                    if (details.steps && Array.isArray(details.steps)) {
                        details.steps.forEach(step => console.log(`  ${turnPrefix}  - ${step}`));
                    }
                    // Log other details directly if they don't fit the structured approach
                    const otherDetails = { ...details };
                    delete otherDetails.calculation;
                    delete otherDetails.steps;
                    if (Object.keys(otherDetails).length > 0) {
                         for (const key in otherDetails) {
                            if (Object.hasOwnProperty.call(otherDetails, key)) {
                                console.log(`  ${turnPrefix}  - ${key}: ${JSON.stringify(otherDetails[key])}`);
                            }
                        }
                    }
                }
                break;
            case this.levels.CONSOLE_INFO:
                console.log(`${turnPrefix} ${message}`);
                if (details && typeof details === 'object') {
                    // Optionally log some brief details for CONSOLE_INFO
                    // For example, if details has a 'summary' field
                    if (details.summary) {
                        console.log(`  ${turnPrefix}  摘要: ${details.summary}`);
                    }
                }
                break;
            case this.levels.BATTLE_LOG:
                // Assuming a global UI object or a specific function to add messages to the battle log UI
                if (window.UI && typeof window.UI.addBattleLogMessage === 'function') {
                    window.UI.addBattleLogMessage(message);
                } else {
                    // Fallback if UI function is not available
                    //console.log(`[UI LOG (Fallback)] ${message}`);
                }
                break;
            default:
                console.warn(`${turnPrefix} Unknown log level: ${level}. Message: ${message}`);
        }
    }
};

// Make BattleLogger globally accessible
window.BattleLogger = BattleLogger;

// Example Usage (can be removed or commented out)
/*
BattleLogger.log(BattleLogger.levels.CONSOLE_DETAIL, "角色A 攻击力计算完成", {
    calculation: "攻击力",
    steps: ["基础攻击: 150", "力量加成: +30", "装备加成: +20"],
    finalValue: 200
}, 1);

BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, "角色A 使用了 治疗术", null, 1);

BattleLogger.log(BattleLogger.levels.BATTLE_LOG, "角色A 对 怪物B 造成了 120 点伤害。");

BattleLogger.log(BattleLogger.levels.CONSOLE_DETAIL, "伤害扣除HP细节", {
    target: "怪物B",
    initialHp: 500,
    damageTaken: 120,
    finalHp: 380
},1);
*/