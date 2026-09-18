/**
 * SkiaBoard 学练模式控制器
 * 负责教程选择、步骤引导、参考底稿（描红）、完成练习与分享
 */
(function () {

  class LearnMode {
    constructor() {
      this.currentLesson = null;
      this.currentStep = 0;
      this.referenceVisible = true;
      this.referenceOpacity = 0.35;
      this.active = false;
      this.refCanvas = null;
      this.refCtx = null;
    }

    initReferenceLayer() {
      if (this.refCanvas) return;
      this.refCanvas = document.getElementById('reference-canvas');
      if (!this.refCanvas) {
        const container = document.getElementById('canvas-container');
        if (!container) return;
        this.refCanvas = document.createElement('canvas');
        this.refCanvas.id = 'reference-canvas';
        this.refCanvas.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:1;';
        container.appendChild(this.refCanvas);
      }
      this.refCtx = this.refCanvas.getContext('2d');
      this._resizeRefCanvas();
      window.addEventListener('resize', () => this._resizeRefCanvas());
    }

    _resizeRefCanvas() {
      if (!this.refCanvas || !window.app) return;
      const app = window.app;
      this.refCanvas.width = app.mainCanvas.width;
      this.refCanvas.height = app.mainCanvas.height;
      this.refCanvas.style.width = app.mainCanvas.style.width;
      this.refCanvas.style.height = app.mainCanvas.style.height;
      if (this.active && this.referenceVisible) this._drawReference();
    }

    enter(lessonId) {
      const lesson = (window.LESSONS || []).find(l => l.id === lessonId);
      if (!lesson) { console.warn('教程不存在:', lessonId); return; }
      this.initReferenceLayer();
      this.currentLesson = lesson;
      this.currentStep = 0;
      this.active = true;
      this.referenceVisible = true;
      if (window.app) {
        window.app.clearAll();
        window.app.setTool('brush');
        window.app.setStrokeWidth(3);
        window.app.setBrushSize(6);
        window.app.setBrushType('round');
      }
      this._showLearnPanel();
      this._updateStepUI();
      this._drawReference();
      const hall = document.getElementById('lesson-hall');
      if (hall) hall.style.display = 'none';
      const learnBar = document.getElementById('learn-topbar');
      if (learnBar) learnBar.style.display = 'flex';
    }

    exit() {
      this.active = false;
      this.currentLesson = null;
      this.currentStep = 0;
      this._clearReference();
      const learnBar = document.getElementById('learn-topbar');
      if (learnBar) learnBar.style.display = 'none';
      const panel = document.getElementById('learn-panel');
      if (panel) panel.style.display = 'none';
      const hall = document.getElementById('lesson-hall');
      if (hall) hall.style.display = 'flex';
    }

    nextStep() {
      if (!this.currentLesson) return;
      if (this.currentStep < this.currentLesson.steps.length - 1) {
        this.currentStep++;
        this._updateStepUI();
        this._drawReference();
      } else {
        this.completeLesson();
      }
    }

    prevStep() {
      if (!this.currentLesson) return;
      if (this.currentStep > 0) {
        this.currentStep--;
        this._updateStepUI();
        this._drawReference();
      }
    }

    toggleReference() {
      this.referenceVisible = !this.referenceVisible;
      if (this.referenceVisible) this._drawReference();
      else this._clearReference();
      const btn = document.getElementById('toggle-ref-btn');
      if (btn) {
        btn.textContent = this.referenceVisible ? '👁 隐藏底稿' : '👁 显示底稿';
        btn.style.opacity = this.referenceVisible ? '1' : '0.5';
      }
    }

    setReferenceOpacity(val) {
      this.referenceOpacity = val;
      if (this.referenceVisible) this._drawReference();
    }

    completeLesson() {
      if (!this.currentLesson) return;
      const colorCount = this._countColors();
      if (window.badgeManager) {
        window.badgeManager.recordLessonComplete(this.currentLesson.id, this.currentLesson.ageGroup);
        window.badgeManager.recordDrawing(colorCount);
      }
      this._showCompleteDialog();
    }

    _countColors() {
      if (!window.app) return 0;
      const colors = new Set();
      window.app.objects.forEach(obj => {
        if (obj.strokeColor && obj.strokeEnabled) colors.add(obj.strokeColor);
        if (obj.fillColor && obj.fillEnabled) colors.add(obj.fillColor);
      });
      return colors.size;
    }

    _drawReference() {
      if (!this.refCtx || !this.currentLesson || !window.app) return;
      const ctx = this.refCtx;
      ctx.clearRect(0, 0, this.refCanvas.width, this.refCanvas.height);
      if (!this.referenceVisible) return;
      const step = this.currentLesson.steps[this.currentStep];
      if (!step || !step.draw) return;
      ctx.save();
      ctx.globalAlpha = this.referenceOpacity;
      const app = window.app;
      const scale = Math.min(app.canvasW, app.canvasH) / 450;
      const offsetX = (app.canvasW - 400 * scale) / 2;
      const offsetY = (app.canvasH - 400 * scale) / 2;
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);
      step.draw(ctx);
      ctx.restore();
    }

    _clearReference() {
      if (this.refCtx) this.refCtx.clearRect(0, 0, this.refCanvas.width, this.refCanvas.height);
    }

    _showLearnPanel() {
      const panel = document.getElementById('learn-panel');
      if (panel) panel.style.display = 'flex';
    }

    _updateStepUI() {
      if (!this.currentLesson) return;
      const step = this.currentLesson.steps[this.currentStep];
      const total = this.currentLesson.steps.length;
      const hintEl = document.getElementById('learn-hint');
      if (hintEl) hintEl.textContent = step ? step.hint : '';
      const progressEl = document.getElementById('learn-progress');
      if (progressEl) progressEl.textContent = `第 ${this.currentStep + 1} / ${total} 步`;
      const barEl = document.getElementById('learn-progress-bar');
      if (barEl) barEl.style.width = `${((this.currentStep + 1) / total) * 100}%`;
      const prevBtn = document.getElementById('prev-step-btn');
      const nextBtn = document.getElementById('next-step-btn');
      if (prevBtn) prevBtn.style.opacity = this.currentStep === 0 ? '0.4' : '1';
      if (nextBtn) nextBtn.textContent = this.currentStep === total - 1 ? '✅ 完成' : '下一步 →';
      const titleEl = document.getElementById('learn-lesson-title');
      if (titleEl) titleEl.textContent = `${this.currentLesson.emoji} ${this.currentLesson.title}`;
    }

    _showCompleteDialog() {
      const lesson = this.currentLesson;
      if (!lesson) return;
      let newBadges = [];
      let titleInfo = null;
      if (window.badgeManager) {
        const all = window.badgeManager.getAll();
        newBadges = all.filter(b => b.unlocked).slice(-3);
        titleInfo = window.badgeManager.getTitle();
      }
      const confetti = this._createConfetti();
      const overlay = document.createElement('div');
      overlay.id = 'complete-overlay';
      overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;';
      const dialog = document.createElement('div');
      dialog.style.cssText = 'background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:20px;padding:32px;max-width:400px;width:100%;text-align:center;border:1px solid rgba(124,111,205,0.3);box-shadow:0 20px 60px rgba(0,0,0,0.5);';
      const celebrate = document.createElement('div');
      celebrate.textContent = '🎉';
      celebrate.style.cssText = 'font-size:48px;margin-bottom:12px;animation:bounce 1s ease infinite;';
      const title = document.createElement('div');
      title.textContent = '太棒了！';
      title.style.cssText = 'font-size:24px;font-weight:700;color:#fff;margin-bottom:8px;';
      const subtitle = document.createElement('div');
      subtitle.textContent = `你完成了「${lesson.title}」`;
      subtitle.style.cssText = 'font-size:15px;color:rgba(255,255,255,0.7);margin-bottom:16px;';
      dialog.appendChild(celebrate); dialog.appendChild(title); dialog.appendChild(subtitle);
      if (titleInfo && titleInfo.name) {
        const titleBar = document.createElement('div');
        titleBar.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:8px;background:rgba(255,255,255,0.06);border:1px solid rgba(124,111,205,0.3);border-radius:20px;padding:6px 16px;margin-bottom:16px;font-size:13px;color:#fff;';
        titleBar.innerHTML = `<span style="font-size:18px;">${titleInfo.emoji}</span><span>当前称号：<b>${titleInfo.name}</b></span><span style="color:rgba(255,255,255,0.5);font-size:11px;">徽章 ${titleInfo.unlockedCount}/${titleInfo.total}</span>`;
        dialog.appendChild(titleBar);
      }
      if (newBadges.length > 0) {
        const badgeLabel = document.createElement('div');
        badgeLabel.textContent = '✨ 获得徽章';
        badgeLabel.style.cssText = 'font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:12px;';
        dialog.appendChild(badgeLabel);
        const badgeRow = document.createElement('div');
        badgeRow.style.cssText = 'display:flex;justify-content:center;gap:16px;margin-bottom:24px;';
        newBadges.forEach(b => {
          const badgeEl = document.createElement('div');
          badgeEl.style.cssText = 'text-align:center;';
          const g = b.gradient && b.gradient.length ? `linear-gradient(135deg,${b.gradient[0]},${b.gradient[1]})` : 'linear-gradient(135deg,#ffd700,#ff8c00)';
          badgeEl.innerHTML = `<div style="width:64px;height:64px;border-radius:50%;background:${g};display:flex;align-items:center;justify-content:center;font-size:30px;margin:0 auto 6px;box-shadow:0 4px 16px rgba(0,0,0,0.35), inset 0 -4px 8px rgba(0,0,0,0.15);border:2px solid rgba(255,255,255,0.4);">${b.emoji}</div><div style="font-size:11px;color:rgba(255,255,255,0.85);">${b.name}</div>`;
          badgeRow.appendChild(badgeEl);
        });
        dialog.appendChild(badgeRow);
      } else {
        const spacer = document.createElement('div');
        spacer.style.cssText = 'height:20px;';
        dialog.appendChild(spacer);
      }
      const btnRow = document.createElement('div');
      btnRow.style.cssText = 'display:flex;gap:10px;justify-content:center;flex-wrap:wrap;';
      const shareBtn = document.createElement('button');
      shareBtn.textContent = '📸 晒到朋友圈';
      shareBtn.style.cssText = 'background:linear-gradient(135deg,#7c6fcd,#4ecdc4);color:#fff;border:none;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;flex:1;min-width:140px;';
      shareBtn.onclick = () => {
        document.body.removeChild(overlay);
        if (window.shareGenerator) window.shareGenerator.showPreview({ lessonTitle: lesson.title, lessonEmoji: lesson.emoji, badges: newBadges });
      };
      const continueBtn = document.createElement('button');
      continueBtn.textContent = '继续画';
      continueBtn.style.cssText = 'background:rgba(255,255,255,0.1);color:#fff;border:1px solid rgba(255,255,255,0.2);padding:12px 24px;border-radius:10px;font-size:14px;cursor:pointer;flex:1;min-width:140px;';
      continueBtn.onclick = () => {
        document.body.removeChild(overlay);
        if (this.referenceVisible) this.toggleReference();
      };
      const backBtn = document.createElement('button');
      backBtn.textContent = '返回课程';
      backBtn.style.cssText = 'background:transparent;color:rgba(255,255,255,0.5);border:none;padding:10px;font-size:13px;cursor:pointer;width:100%;margin-top:8px;';
      backBtn.onclick = () => { document.body.removeChild(overlay); this.exit(); };
      btnRow.appendChild(shareBtn); btnRow.appendChild(continueBtn);
      dialog.appendChild(btnRow); dialog.appendChild(backBtn);
      overlay.appendChild(dialog);
      if (confetti) document.body.appendChild(confetti);
      overlay.onclick = (e) => { if (e.target === overlay) { document.body.removeChild(overlay); if (confetti && confetti.parentNode) document.body.removeChild(confetti); } };
      document.body.appendChild(overlay);
      const style = document.createElement('style');
      style.textContent = '@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} } @keyframes confettiFall { 0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(110vh) rotate(720deg);opacity:0.2} }';
      document.head.appendChild(style);
    }

    /** 生成撒花粒子层 */
    _createConfetti() {
      try {
        const confetti = document.createElement('div');
        confetti.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:hidden;z-index:10001;';
        const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4ecdc4', '#7c6fcd', '#f093fb', '#ff9f43'];
        for (let i = 0; i < 26; i++) {
          const p = document.createElement('div');
          const size = 6 + Math.random() * 6;
          const rot = Math.floor(Math.random() * 360);
          p.style.cssText = `position:absolute;left:${Math.random() * 100}%;top:-24px;width:${size}px;height:${size * 0.55}px;background:${colors[i % colors.length]};border-radius:2px;opacity:${0.75 + Math.random() * 0.25};transform:rotate(${rot}deg);animation:confettiFall ${2 + Math.random() * 2.2}s linear ${Math.random() * 0.9}s infinite;`;
          confetti.appendChild(p);
        }
        return confetti;
      } catch (e) { return null; }
    }

    renderLessonHall() {
      const hall = document.getElementById('lesson-hall');
      if (!hall) return;
      const lessons = window.LESSONS || [];
      const ageGroups = [
        { key: 'kindergarten', label: '🧒 幼儿园', desc: '3-6岁 · 涂鸦启蒙' },
        { key: 'primary', label: '👦 小学', desc: '7-12岁 · 分步跟学' },
        { key: 'middle', label: '🧑‍🎓 中学', desc: '13-18岁 · 技巧提升' },
        { key: 'adult', label: '👨‍💼 成人', desc: '18岁+ · 解压创作' }
      ];
      let html = `
        <div class="hall-header">
          <div class="hall-logo">⬡ <span>Skia</span>Board</div>
          <div class="hall-slogan">跟着画，一起画，人人会画画</div>
          <div class="hall-subtitle">开源免费的简笔画学练平台 · 支持多人协作</div>
        </div>
        <div class="hall-actions">
          <button class="hall-btn primary" onclick="document.getElementById('lesson-hall').style.display='none'">🎨 自由绘画</button>
          <button class="hall-btn" onclick="showBadgesPanel()">🏆 我的徽章</button>
        </div>
      `;
      ageGroups.forEach(ag => {
        const groupLessons = lessons.filter(l => l.ageGroup === ag.key);
        if (groupLessons.length === 0) return;
        html += `<div class="hall-section"><div class="hall-section-title">${ag.label}</div><div class="hall-section-desc">${ag.desc}</div><div class="hall-lesson-grid">`;
        groupLessons.forEach(lesson => {
          const completed = window.badgeManager && window.badgeManager.data.stats.lessonsCompleted[lesson.id];
          const stars = '★'.repeat(lesson.difficulty) + '☆'.repeat(5 - lesson.difficulty);
          html += `
            <div class="lesson-card" onclick="learnMode.enter('${lesson.id}')">
              <div class="lesson-emoji">${lesson.emoji}</div>
              <div class="lesson-name">${lesson.title}</div>
              <div class="lesson-meta"><span class="lesson-stars">${stars}</span><span class="lesson-duration">${lesson.duration}分钟</span></div>
              <div class="lesson-desc">${lesson.description}</div>
              ${completed ? '<div class="lesson-completed">✓ 已完成</div>' : '<div class="lesson-start">开始练习 →</div>'}
            </div>
          `;
        });
        html += `</div></div>`;
      });
      html += `
        <div class="hall-footer">
          <p>💡 提示：完成教程后可生成分享图，发朋友圈晒徽章！</p>
          <p>⭐ 喜欢这个项目？去 GitHub 点个 Star 支持一下：</p>
          <a href="https://github.com/shixingya/skia_board" target="_blank" class="hall-github">github.com/shixingya/skia_board</a>
        </div>
      `;
      hall.innerHTML = html;
    }
  }

  window.learnMode = new LearnMode();

  window.showBadgesPanel = function () {
    if (!window.badgeManager) return;
    const all = window.badgeManager.getAll();
    const stats = window.badgeManager.getStats();
    const streak = window.badgeManager.getStreakDays();
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto;';
    const panel = document.createElement('div');
    panel.style.cssText = 'background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:20px;padding:28px;max-width:500px;width:100%;border:1px solid rgba(124,111,205,0.3);max-height:85vh;overflow-y:auto;';
    const unlockedCount = all.filter(b => b.unlocked).length;
    const titleInfo = window.badgeManager.getTitle();
    const titleBlock = titleInfo && titleInfo.name ? `
      <div style="display:flex;align-items:center;gap:10px;background:linear-gradient(135deg,rgba(124,111,205,0.2),rgba(78,205,196,0.15));border:1px solid rgba(124,111,205,0.35);border-radius:12px;padding:12px 14px;margin-bottom:16px;">
        <div style="font-size:32px;">${titleInfo.emoji}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:11px;color:rgba(255,255,255,0.5);">当前称号</div>
          <div style="font-size:18px;font-weight:700;color:#fff;">${titleInfo.name}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:16px;font-weight:700;color:#4ecdc4;">${titleInfo.unlockedCount}<span style="font-size:11px;color:rgba(255,255,255,0.5);">/${titleInfo.total}</span></div>
          <div style="font-size:10px;color:rgba(255,255,255,0.4);">已解锁徽章</div>
        </div>
      </div>` : '';
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div style="font-size:20px;font-weight:700;color:#fff;">🏆 我的徽章</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.6);">${unlockedCount}/${all.length}</div>
      </div>
      ${titleBlock}
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">
        <div style="text-align:center;padding:10px;background:rgba(255,255,255,0.05);border-radius:10px;"><div style="font-size:20px;font-weight:700;color:#4ecdc4;">${stats.totalDrawings}</div><div style="font-size:11px;color:rgba(255,255,255,0.5);">画作</div></div>
        <div style="text-align:center;padding:10px;background:rgba(255,255,255,0.05);border-radius:10px;"><div style="font-size:20px;font-weight:700;color:#7c6fcd;">${Object.keys(stats.lessonsCompleted).length}</div><div style="font-size:11px;color:rgba(255,255,255,0.5);">教程</div></div>
        <div style="text-align:center;padding:10px;background:rgba(255,255,255,0.05);border-radius:10px;"><div style="font-size:20px;font-weight:700;color:#ffd93d;">${streak}</div><div style="font-size:11px;color:rgba(255,255,255,0.5);">连续天数</div></div>
        <div style="text-align:center;padding:10px;background:rgba(255,255,255,0.05);border-radius:10px;"><div style="font-size:20px;font-weight:700;color:#ff6b6b;">${stats.shareCount}</div><div style="font-size:11px;color:rgba(255,255,255,0.5);">分享</div></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">
        ${all.map(b => `
          <div style="display:flex;align-items:center;gap:10px;padding:10px;background:${b.unlocked ? 'rgba(124,111,205,0.15)' : 'rgba(255,255,255,0.03)'};border:1px solid ${b.unlocked ? 'rgba(124,111,205,0.4)' : 'rgba(255,255,255,0.08)'};border-radius:10px;opacity:${b.unlocked ? 1 : 0.5};">
            <div style="font-size:28px;filter:${b.unlocked ? 'none' : 'grayscale(1)'};">${b.emoji}</div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:13px;font-weight:600;color:${b.unlocked ? '#fff' : '#888'};">${b.name}</div>
              <div style="font-size:11px;color:rgba(255,255,255,0.5);">${b.unlocked ? b.rarityLabel : b.tip}</div>
            </div>
          </div>
        `).join('')}
      </div>
      <button id="badges-close-btn" style="width:100%;margin-top:20px;padding:12px;background:rgba(255,255,255,0.1);color:#fff;border:1px solid rgba(255,255,255,0.2);border-radius:10px;font-size:14px;cursor:pointer;">关闭</button>
    `;
    overlay.appendChild(panel);
    overlay.onclick = (e) => { if (e.target === overlay) document.body.removeChild(overlay); };
    document.body.appendChild(overlay);
    document.getElementById('badges-close-btn').onclick = () => document.body.removeChild(overlay);
  };

})();
