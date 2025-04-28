/**
 * 职业选择模块 - 负责处理职业选择界面
 */
(function() {
    // 确保UI对象存在
    if (typeof UI === 'undefined') {
        console.error('UI模块未加载');
        return;
    }

    /**
     * 显示职业选择界面
     * @param {string} characterId - 角色ID
     */
    UI.showJobSelection = function(characterId) {
        console.log('显示职业选择界面:', characterId);

        // 获取角色
        if (typeof Character === 'undefined' || typeof Character.getCharacter !== 'function') {
            console.error('Character模块未加载或getCharacter方法不存在');
            alert('角色系统未就绪');
            return;
        }

        const character = Character.getCharacter(characterId);
        if (!character) {
            console.error('找不到角色:', characterId);
            alert('找不到角色');
            return;
        }

        // 获取可用职业
        let availableJobs = [];
        if (typeof Character.getAvailableJobs === 'function') {
            availableJobs = Character.getAvailableJobs(characterId);
        } else if (typeof JobSystem !== 'undefined' && typeof JobSystem.getAvailableJobs === 'function') {
            availableJobs = JobSystem.getAvailableJobs(character);
        } else {
            console.error('无法获取可用职业');
            alert('职业系统未就绪');
            return;
        }

        // 创建遮罩层
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        overlay.id = 'job-selection-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        overlay.style.zIndex = '999';
        document.body.appendChild(overlay);

        // 创建对话框
        const dialog = document.createElement('div');
        dialog.className = 'dialog job-selection-dialog';
        dialog.id = 'job-selection-dialog';
        dialog.style.position = 'fixed';
        dialog.style.top = '50%';
        dialog.style.left = '50%';
        dialog.style.transform = 'translate(-50%, -50%)';
        dialog.style.backgroundColor = '#fff';
        dialog.style.padding = '20px';
        dialog.style.border = '1px solid #ccc';
        dialog.style.zIndex = '1000';
        dialog.style.maxWidth = '80%';
        dialog.style.maxHeight = '80%';
        dialog.style.overflow = 'auto';
        dialog.style.fontFamily = 'Courier New, Courier, monospace';

        // 设置对话框内容
        dialog.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; padding-bottom:5px; border-bottom:1px solid #ccc;">
                <h2 style="margin:0;">职业选择</h2>
                <button class="close-button" style="background:none; border:none; font-size:20px; cursor:pointer;">&times;</button>
            </div>

            <div style="margin-bottom:15px;">
                <p>当前职业：<strong>${Character.getJobName(character)}</strong> (Lv.${Character.getJobLevel(character)})</p>
                <p>选择一个职业进行切换：</p>
            </div>

            <div id="job-list" style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:20px;">
                <!-- 职业列表将在这里动态生成 -->
            </div>

            <div id="job-details" style="margin-bottom:20px; padding:10px; border:1px solid #eee; display:none;">
                <!-- 职业详情将在这里动态生成 -->
            </div>
        `;

        // 添加到文档
        document.body.appendChild(dialog);

        // 添加关闭按钮事件
        dialog.querySelector('.close-button').addEventListener('click', function() {
            closeJobSelectionDialog();
        });

        // 生成职业列表
        const jobListContainer = document.getElementById('job-list');
        if (jobListContainer) {
            // 按职业等级分组
            const tier1Jobs = [];
            const tier2Jobs = [];

            availableJobs.forEach(jobId => {
                const jobInfo = typeof JobSystem !== 'undefined' ? JobSystem.getJob(jobId) : null;
                if (jobInfo) {
                    if (jobInfo.tier === 1) {
                        tier1Jobs.push(jobInfo);
                    } else if (jobInfo.tier === 2) {
                        tier2Jobs.push(jobInfo);
                    }
                }
            });

            // 添加一阶职业
            if (tier1Jobs.length > 0) {
                const tier1Container = document.createElement('div');
                tier1Container.style.width = '100%';
                tier1Container.innerHTML = `<h3 style="margin-top:0; margin-bottom:10px; padding-bottom:5px; border-bottom:1px solid #eee;">一阶职业</h3>`;
                jobListContainer.appendChild(tier1Container);

                tier1Jobs.forEach(jobInfo => {
                    const jobCard = createJobCard(jobInfo, character);
                    jobListContainer.appendChild(jobCard);
                });
            }

            // 添加二阶职业
            if (tier2Jobs.length > 0) {
                const tier2Container = document.createElement('div');
                tier2Container.style.width = '100%';
                tier2Container.style.marginTop = '20px';
                tier2Container.innerHTML = `<h3 style="margin-top:0; margin-bottom:10px; padding-bottom:5px; border-bottom:1px solid #eee;">二阶职业</h3>`;
                jobListContainer.appendChild(tier2Container);

                tier2Jobs.forEach(jobInfo => {
                    const jobCard = createJobCard(jobInfo, character);
                    jobListContainer.appendChild(jobCard);
                });
            }
        }

        /**
         * 创建职业卡片
         * @param {object} jobInfo - 职业信息
         * @param {object} character - 角色对象
         * @returns {HTMLElement} 职业卡片元素
         */
        function createJobCard(jobInfo, character) {
            // 获取职业ID
            const jobId = Object.keys(JobSystem.jobs).find(id => JobSystem.jobs[id] === jobInfo);
            const isCurrentJob = character.job.current === jobId;

            const jobCard = document.createElement('div');
            jobCard.className = 'job-card';
            jobCard.dataset.jobId = jobId;
            jobCard.style.width = 'calc(33.33% - 10px)';
            jobCard.style.padding = '10px';
            jobCard.style.border = isCurrentJob ? '2px solid #333' : '1px solid #ccc';
            jobCard.style.cursor = 'pointer';
            jobCard.style.backgroundColor = isCurrentJob ? '#f0f0f0' : '#fff';

            // 职业等级标记
            const jobLevelBadge = character.job.jobLevels && character.job.jobLevels[jobId] ?
                `<span style="position:absolute; top:5px; right:5px; padding:2px 5px; background:#eee; font-size:12px;">Lv.${character.job.jobLevels[jobId]}</span>` : '';

            jobCard.innerHTML = `
                <div style="position:relative;">
                    <h4 style="margin-top:0; margin-bottom:5px;">${jobInfo.name}</h4>
                    ${jobLevelBadge}
                </div>
                <div style="font-size:12px; color:#666; margin-bottom:5px;">
                    ${jobInfo.tier === 1 ? '一阶职业' : '二阶职业'}
                </div>
                <div style="font-size:12px; margin-bottom:5px;">
                    HP: ${jobInfo.baseStats?.hp || 0} |
                    攻击: ${jobInfo.baseStats?.attack || 0} |
                    防御: ${jobInfo.baseStats?.defense || 0}
                </div>
            `;

            // 添加点击事件
            jobCard.addEventListener('click', function() {
                // 显示职业详情
                showJobDetails(jobInfo, character);

                // 高亮选中的职业卡片
                document.querySelectorAll('.job-card').forEach(card => {
                    card.style.border = '1px solid #ccc';
                    card.style.backgroundColor = '#fff';
                });
                jobCard.style.border = '2px solid #333';
                jobCard.style.backgroundColor = '#f0f0f0';
            });

            return jobCard;
        }

        /**
         * 显示职业详情
         * @param {object} jobInfo - 职业信息
         * @param {object} character - 角色对象
         */
        function showJobDetails(jobInfo, character) {
            const detailsContainer = document.getElementById('job-details');
            if (!detailsContainer) return;

            // 获取职业ID
            const jobId = Object.keys(JobSystem.jobs).find(id => JobSystem.jobs[id] === jobInfo);

            // 获取职业等级
            const jobLevel = character.job.jobLevels && character.job.jobLevels[jobId] ?
                character.job.jobLevels[jobId] : 1;

            // 获取职业技能
            let skills = [];
            if (typeof JobSystem !== 'undefined' && typeof JobSystem.getJobSkills === 'function') {
                skills = JobSystem.getJobSkills(jobId, jobLevel);
            } else if (jobInfo.skills) {
                skills = jobInfo.skills;
            }

            // 生成技能列表HTML
            let skillsHtml = '';
            if (skills.length > 0) {
                skillsHtml = `
                    <div style="margin-top:15px;">
                        <h4 style="margin-top:0; margin-bottom:10px; padding-bottom:5px; border-bottom:1px solid #eee;">技能</h4>
                        <div style="display:flex; flex-direction:column; gap:5px;">
                `;

                skills.forEach(skillId => {
                    const skillInfo = typeof JobSystem !== 'undefined' && typeof JobSystem.getSkill === 'function' ?
                        JobSystem.getSkill(skillId) : null;

                    if (skillInfo) {
                        skillsHtml += `
                            <div style="padding:5px; border:1px solid #eee; display:flex; justify-content:space-between; ${skillInfo.fixed ? 'background-color:#f0f0f0;' : ''}">
                                <div>
                                    ${skillInfo.name}
                                    ${skillInfo.fixed ? '<span style="color:#ff6600; margin-left:5px;">[固定]</span>' : ''}
                                </div>
                                <div style="color:#666; font-size:12px;">${skillInfo.type}</div>
                            </div>
                        `;
                    } else {
                        skillsHtml += `
                            <div style="padding:5px; border:1px solid #eee;">
                                ${skillId}
                            </div>
                        `;
                    }
                });

                skillsHtml += `
                        </div>
                    </div>
                `;
            }

            // 生成进阶职业HTML
            let nextTiersHtml = '';
            if (jobInfo.nextTiers && jobInfo.nextTiers.length > 0) {
                nextTiersHtml = `
                    <div style="margin-top:15px;">
                        <h4 style="margin-top:0; margin-bottom:10px; padding-bottom:5px; border-bottom:1px solid #eee;">进阶职业</h4>
                        <div style="display:flex; flex-wrap:wrap; gap:5px;">
                `;

                jobInfo.nextTiers.forEach(nextJobId => {
                    const nextJobInfo = typeof JobSystem !== 'undefined' ? JobSystem.getJob(nextJobId) : null;

                    if (nextJobInfo) {
                        // 检查是否已解锁
                        const isUnlocked = character.job.unlockedJobs && character.job.unlockedJobs.includes(nextJobId);

                        nextTiersHtml += `
                            <div style="padding:5px 10px; border:1px solid #eee; ${isUnlocked ? 'background:#f0f0f0;' : ''}">
                                ${nextJobInfo.name}
                                ${isUnlocked ? '<span style="margin-left:5px; color:green;">✓</span>' :
                                    `<span style="margin-left:5px; color:#999; font-size:12px;">(需${jobInfo.name} Lv.${nextJobInfo.requiredLevel})</span>`}
                            </div>
                        `;
                    } else {
                        nextTiersHtml += `
                            <div style="padding:5px 10px; border:1px solid #eee;">
                                ${nextJobId}
                            </div>
                        `;
                    }
                });

                nextTiersHtml += `
                        </div>
                    </div>
                `;
            }

            // 设置详情内容
            detailsContainer.innerHTML = `
                <h3 style="margin-top:0; margin-bottom:10px;">${jobInfo.name}</h3>
                <div style="margin-bottom:10px; font-size:14px; color:#666;">
                    ${jobInfo.tier === 1 ? '一阶职业' : '二阶职业'} | 当前等级: ${jobLevel}
                </div>

                <div style="margin-bottom:10px;">
                    ${jobInfo.description || ''}
                </div>

                <div style="display:flex; gap:10px; margin-bottom:10px;">
                    <div style="flex:1; padding:5px; border:1px solid #eee; text-align:center;">
                        <div style="font-weight:bold; margin-bottom:5px;">生命值</div>
                        <div>${jobInfo.baseStats?.hp || 0}</div>
                    </div>
                    <div style="flex:1; padding:5px; border:1px solid #eee; text-align:center;">
                        <div style="font-weight:bold; margin-bottom:5px;">攻击力</div>
                        <div>${jobInfo.baseStats?.attack || 0}</div>
                    </div>
                    <div style="flex:1; padding:5px; border:1px solid #eee; text-align:center;">
                        <div style="font-weight:bold; margin-bottom:5px;">防御力</div>
                        <div>${jobInfo.baseStats?.defense || 0}</div>
                    </div>
                    <div style="flex:1; padding:5px; border:1px solid #eee; text-align:center;">
                        <div style="font-weight:bold; margin-bottom:5px;">速度</div>
                        <div>${jobInfo.baseStats?.speed || 0}</div>
                    </div>
                </div>

                ${skillsHtml}

                ${nextTiersHtml}

                <div style="margin-top:20px; text-align:center;">
                    <button id="change-job-btn" class="btn" style="padding:8px 16px; ${character.job.current === jobId ? 'background:#eee; cursor:not-allowed;' : ''}">
                        ${character.job.current === jobId ? '当前职业' : '切换职业'}
                    </button>
                </div>
            `;

            // 显示详情容器
            detailsContainer.style.display = 'block';

            // 添加切换职业按钮事件
            const changeJobBtn = document.getElementById('change-job-btn');
            if (changeJobBtn && character.job.current !== jobId) {
                changeJobBtn.addEventListener('click', function() {
                    changeJob(character.id, jobId);
                });
            }
        }

        /**
         * 切换职业
         * @param {string} characterId - 角色ID
         * @param {string} newJobId - 新职业ID
         */
        function changeJob(characterId, newJobId) {
            if (typeof Character === 'undefined' || typeof Character.changeJob !== 'function') {
                console.error('Character.changeJob方法不存在');
                alert('职业系统未就绪');
                return;
            }

            const success = Character.changeJob(characterId, newJobId);

            if (success) {
                // 更新角色信息
                const character = Character.getCharacter(characterId);

                // 显示成功消息
                if (typeof UI !== 'undefined' && typeof UI.showNotification === 'function') {
                    const jobName = Character.getJobName(character);
                    UI.showNotification(`职业切换成功：${jobName}`, 'success', 3000);
                } else {
                    alert(`职业切换成功`);
                }

                // 关闭对话框
                closeJobSelectionDialog();

                // 刷新主角信息
                if (typeof UI !== 'undefined' && typeof UI.renderMainCharacter === 'function') {
                    UI.renderMainCharacter();
                }
            } else {
                alert('职业切换失败');
            }
        }

        /**
         * 关闭职业选择对话框
         */
        function closeJobSelectionDialog() {
            const overlay = document.getElementById('job-selection-overlay');
            if (overlay) {
                overlay.remove();
            }

            const dialog = document.getElementById('job-selection-dialog');
            if (dialog) {
                dialog.remove();
            }
        }
    };
})();
