/**
 * SkiaBoard 朋友圈分享图生成
 * 生成精美的竖版分享卡片，包含作品、新徽章、称号、成长数据、二维码
 *
 * v1.1 迭代：
 * - 卡片升级为 750x1200 竖版，内容更丰富
 * - 新增趣味宣传文案池（每次分享文案不同，自带传播钩子）
 * - 新徽章大图展示（放射光芒 + 稀有度标签）
 * - 新增称号条（绘画萌新 → 绘画大师）与徽章收集进度条
 * - 新增成长数据行（画作 / 连续天数 / 完成教程 / 分享次数）
 * - 背景增强：星点、光晕、装饰圆环
 */
(function () {

  const CARD_W = 750;
  const CARD_H = 1200;

  // 趣味宣传文案池：{ text: 主标题, sub: 副标题（支持 {lesson} {badge} 占位） }
  const SLOGANS = [
    { text: '5 分钟，从绘画小白到小画家！', sub: '在 SkiaBoard 解锁「{badge}」徽章' },
    { text: '跟着画、一起画，人人会画画！', sub: '刚画完「{lesson}」，快来围观' },
    { text: '解锁新徽章，快乐 +1！', sub: '免费开源画板，人人都能画' },
    { text: '简笔画解压，顺便集个徽章～', sub: '你的下一幅画，会是什么？' },
    { text: '这个画板太上头了！', sub: '分龄教程 + 徽章成就，根本停不下来' },
    { text: '画个小画，晒个小徽章 ✨', sub: 'SkiaBoard 邀你一起画' }
  ];

  class ShareGenerator {

    generate(options = {}) {
      const canvas = document.createElement('canvas');
      canvas.width = CARD_W;
      canvas.height = CARD_H;
      const ctx = canvas.getContext('2d');
      const badges = options.badges && options.badges.length ? options.badges : this._collectNewBadges();
      const title = this._collectTitle();
      const stats = this._collectStats();
      this._drawBackground(ctx);
      this._drawHeader(ctx);
      let y = this._drawSlogan(ctx, options, badges);
      y = this._drawArtwork(ctx, options.sourceCanvas, y);
      if (badges.length) y = this._drawNewBadges(ctx, badges, y);
      y = this._drawTitleBar(ctx, title, y);
      y = this._drawStats(ctx, stats, y);
      this._drawFooter(ctx);
      return canvas.toDataURL('image/png');
    }

    _collectNewBadges() {
      try {
        if (!window.badgeManager) return [];
        const all = window.badgeManager.getAll();
        const unlocked = all.filter(b => b.unlocked);
        return unlocked.slice(-3);
      } catch (e) { return []; }
    }

    _collectTitle() {
      try {
        if (!window.badgeManager) return null;
        return window.badgeManager.getTitle();
      } catch (e) { return null; }
    }

    _collectStats() {
      try {
        if (!window.badgeManager) return null;
        const stats = window.badgeManager.getStats();
        return {
          drawings: stats.totalDrawings || 0,
          streak: window.badgeManager.getStreakDays() || 0,
          lessons: Object.keys(stats.lessonsCompleted || {}).length,
          shares: stats.shareCount || 0
        };
      } catch (e) { return null; }
    }

    _pickSlogan(options, badges) {
      const pool = SLOGANS.slice();
      const idx = Math.floor(Math.random() * pool.length);
      const s = pool[idx];
      let sub = s.sub;
      const lesson = options.lessonTitle || (options.lessonEmoji ? options.lessonEmoji : '作品');
      const badgeName = badges.length ? badges[0].name : '新徽章';
      sub = sub.replace('{lesson}', lesson).replace('{badge}', badgeName);
      return { text: s.text, sub };
    }

    _drawBackground(ctx) {
      const grad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
      grad.addColorStop(0, '#1a1a2e');
      grad.addColorStop(0.45, '#16213e');
      grad.addColorStop(1, '#0f3460');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CARD_W, CARD_H);
      // 顶部彩虹光带
      const rainbow = ctx.createLinearGradient(0, 0, CARD_W, 0);
      ['#ff6b6b', '#ffd93d', '#6bcb77', '#4ecdc4', '#7c6fcd', '#f093fb'].forEach((c, i) => {
        rainbow.addColorStop(i / 5, c);
      });
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = rainbow;
      ctx.fillRect(0, 0, CARD_W, 6);
      ctx.restore();
      // 光晕
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.beginPath(); ctx.arc(0, 0, 220, 0, Math.PI * 2); ctx.fillStyle = '#7c6fcd'; ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = 0.1;
      ctx.beginPath(); ctx.arc(CARD_W, CARD_H, 280, 0, Math.PI * 2); ctx.fillStyle = '#4ecdc4'; ctx.fill();
      ctx.restore();
      // 装饰圆环
      ctx.save();
      ctx.globalAlpha = 0.06;
      ctx.strokeStyle = '#4ecdc4'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(90, 180, 50, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(CARD_W - 80, 900, 70, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      // 星点
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#fff';
      [[80,140],[650,100],[130,900],[680,720],[60,520],[700,420],[300,1130],[520,1160]].forEach(([x,y]) => {
        ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
      });
      ctx.restore();
    }

    _drawHeader(ctx) {
      ctx.save();
      ctx.beginPath(); ctx.arc(60, 65, 18, 0, Math.PI * 2);
      const logoGrad = ctx.createLinearGradient(42, 47, 78, 83);
      logoGrad.addColorStop(0, '#7c6fcd'); logoGrad.addColorStop(1, '#4ecdc4');
      ctx.fillStyle = logoGrad; ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.font = 'bold 28px "Sora", sans-serif'; ctx.fillStyle = '#fff';
      ctx.fillText('SkiaBoard', 90, 73);
      ctx.font = '14px "Sora", sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText('跟着画，一起画，人人会画画', 90, 95);
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(40, 120); ctx.lineTo(CARD_W - 40, 120); ctx.stroke();
      ctx.restore();
    }

    _drawSlogan(ctx, options, badges) {
      const s = this._pickSlogan(options, badges);
      ctx.save(); ctx.textAlign = 'center';
      ctx.font = 'bold 30px "Sora", sans-serif'; ctx.fillStyle = '#fff';
      this._wrapText(ctx, s.text, CARD_W / 2, 165, CARD_W - 100, 40);
      ctx.font = '15px "Sora", sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.65)';
      this._wrapText(ctx, s.sub, CARD_W / 2, 205, CARD_W - 120, 24);
      ctx.restore();
      return 240;
    }

    _wrapText(ctx, text, cx, y, maxW, lineH) {
      const chars = text.split('');
      let line = '';
      for (let i = 0; i < chars.length; i++) {
        const test = line + chars[i];
        if (ctx.measureText(test).width > maxW && line) {
          ctx.fillText(line, cx, y);
          line = chars[i];
          y += lineH;
        } else {
          line = test;
        }
      }
      if (line) ctx.fillText(line, cx, y);
      return y + lineH;
    }

    _drawArtwork(ctx, sourceCanvas, y) {
      const cardX = 50, cardY = y, cardW = CARD_W - 100, cardH = 400;
      ctx.save();
      this._roundRect(ctx, cardX, cardY, cardW, cardH, 20);
      ctx.fillStyle = '#f8f8fc'; ctx.fill();
      ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 6;
      ctx.fill();
      ctx.restore();
      const src = sourceCanvas || (window.app && window.app.mainCanvas);
      if (src) {
        const imgData = this._getArtworkImage(src);
        if (imgData) {
          const padding = 25;
          const availW = cardW - padding * 2, availH = cardH - padding * 2;
          const scale = Math.min(availW / imgData.width, availH / imgData.height);
          const drawW = imgData.width * scale, drawH = imgData.height * scale;
          const drawX = cardX + (cardW - drawW) / 2, drawY = cardY + (cardH - drawH) / 2;
          ctx.save();
          this._roundRect(ctx, drawX - 5, drawY - 5, drawW + 10, drawH + 10, 10);
          ctx.fillStyle = '#fff'; ctx.fill();
          ctx.restore();
          ctx.drawImage(imgData, drawX, drawY, drawW, drawH);
        }
      }
      return cardY + cardH;
    }

    _getArtworkImage(canvas) {
      try {
        const w = canvas.width, h = canvas.height;
        const ctx = canvas.getContext('2d');
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;
        let minX = w, minY = h, maxX = 0, maxY = 0, hasContent = false;
        for (let y = 0; y < h; y += 2) {
          for (let x = 0; x < w; x += 2) {
            const idx = (y * w + x) * 4;
            if (data[idx + 3] > 10) {
              hasContent = true;
              if (x < minX) minX = x; if (y < minY) minY = y;
              if (x > maxX) maxX = x; if (y > maxY) maxY = y;
            }
          }
        }
        if (!hasContent) return null;
        const pad = 20;
        minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
        maxX = Math.min(w, maxX + pad); maxY = Math.min(h, maxY + pad);
        const cropW = maxX - minX, cropH = maxY - minY;
        if (cropW < 10 || cropH < 10) return null;
        const out = document.createElement('canvas');
        out.width = cropW; out.height = cropH;
        out.getContext('2d').drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
        return out;
      } catch (e) { console.error('提取作品图失败', e); return null; }
    }

    _drawNewBadges(ctx, badges, y) {
      ctx.save(); ctx.textAlign = 'center';
      ctx.font = '13px "Sora", sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText('✨ 新获得徽章', CARD_W / 2, y); y += 26;
      const badgeSize = 96, gap = 30;
      const show = badges.slice(0, 3);
      const totalW = show.length * badgeSize + (show.length - 1) * gap;
      let startX = (CARD_W - totalW) / 2;
      show.forEach((badge, i) => {
        const cx = startX + badgeSize / 2, cy = y + badgeSize / 2;
        // 放射光芒
        this._drawRays(ctx, cx, cy, badgeSize / 2 + 10);
        // 徽章底
        const grad = ctx.createRadialGradient(cx - 14, cy - 14, 5, cx, cy, badgeSize / 2);
        grad.addColorStop(0, badge.gradient ? badge.gradient[0] : '#ffd700');
        grad.addColorStop(1, badge.gradient ? badge.gradient[1] : '#ff8c00');
        ctx.beginPath(); ctx.arc(cx, cy, badgeSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = grad; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3; ctx.stroke();
        // 内侧高光
        ctx.save();
        ctx.globalAlpha = 0.25; ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(cx - 16, cy - 16, badgeSize / 6, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        // emoji
        ctx.font = '46px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(badge.emoji || '🏅', cx, cy + 2);
        ctx.textBaseline = 'alphabetic';
        // 名称
        ctx.font = 'bold 15px "Sora", sans-serif'; ctx.fillStyle = '#fff';
        ctx.fillText(badge.name, cx, y + badgeSize + 22);
        // 稀有度标签
        const rarLabel = badge.rarityLabel || '';
        const rarColors = { 普通: 'rgba(255,255,255,0.35)', 稀有: '#ffd93d', 史诗: '#c471f5', 传说: '#ff8c42' };
        const rarColor = rarColors[rarLabel] || 'rgba(255,255,255,0.35)';
        ctx.font = '10px "Sora", sans-serif'; ctx.fillStyle = rarColor;
        ctx.fillText(rarLabel, cx, y + badgeSize + 40);
        startX += badgeSize + gap;
      });
      ctx.restore();
      return y + badgeSize + 56;
    }

    _drawRays(ctx, cx, cy, radius) {
      ctx.save();
      const rays = 12;
      for (let i = 0; i < rays; i++) {
        const angle = (Math.PI * 2 / rays) * i;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.globalAlpha = 0.14;
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-9, -radius * 1.25);
        ctx.lineTo(9, -radius * 1.25);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    _drawTitleBar(ctx, title, y) {
      y += 8;
      ctx.save(); ctx.textAlign = 'center';
      if (title && title.name) {
        ctx.font = 'bold 22px "Sora", sans-serif'; ctx.fillStyle = '#fff';
        ctx.fillText(`${title.emoji || ''} 我的称号：${title.name}`, CARD_W / 2, y); y += 30;
        // 收集进度条
        if (title.total > 0) {
          const barW = 420, barH = 12, barX = (CARD_W - barW) / 2, barY = y + 6;
          const pct = Math.min(1, (title.unlockedCount || 0) / title.total);
          ctx.fillStyle = 'rgba(255,255,255,0.12)';
          this._roundRect(ctx, barX, barY, barW, barH, 6); ctx.fill();
          const pg = ctx.createLinearGradient(barX, 0, barX + barW, 0);
          pg.addColorStop(0, '#7c6fcd'); pg.addColorStop(1, '#4ecdc4');
          ctx.fillStyle = pg;
          this._roundRect(ctx, barX, barY, barW * pct, barH, 6); ctx.fill();
          ctx.font = '11px "Sora", sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.6)';
          ctx.fillText(`徽章收集 ${title.unlockedCount}/${title.total}`, CARD_W / 2, barY + barH + 18);
          y = barY + barH + 32;
        }
      }
      ctx.restore();
      return y;
    }

    _drawStats(ctx, stats, y) {
      if (!stats) return y + 20;
      const items = [
        { value: stats.drawings, label: '画作', color: '#4ecdc4' },
        { value: stats.streak, label: '连续天数', color: '#ffd93d' },
        { value: stats.lessons, label: '完成教程', color: '#7c6fcd' },
        { value: stats.shares, label: '分享', color: '#ff6b6b' }
      ];
      const cellW = 140, gap = 14;
      const totalW = items.length * cellW + (items.length - 1) * gap;
      let startX = (CARD_W - totalW) / 2;
      ctx.save(); ctx.textAlign = 'center';
      items.forEach(item => {
        const x = startX + cellW / 2;
        this._roundRect(ctx, startX, y, cellW, 74, 12);
        ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1; ctx.stroke();
        ctx.font = 'bold 24px "Sora", sans-serif'; ctx.fillStyle = item.color;
        ctx.fillText(String(item.value), x, y + 30);
        ctx.font = '12px "Sora", sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fillText(item.label, x, y + 54);
        startX += cellW + gap;
      });
      ctx.restore();
      return y + 92;
    }

    _drawFooter(ctx) {
      const footerY = CARD_H - 120;
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(40, footerY); ctx.lineTo(CARD_W - 40, footerY); ctx.stroke();
      ctx.restore();
      const qrSize = 80, qrX = 60, qrY = footerY + 20;
      ctx.save();
      this._roundRect(ctx, qrX, qrY, qrSize, qrSize, 8);
      ctx.fillStyle = '#fff'; ctx.fill();
      ctx.restore();
      this._drawFakeQR(ctx, qrX + 8, qrY + 8, qrSize - 16);
      ctx.save(); ctx.textAlign = 'left';
      ctx.font = 'bold 18px "Sora", sans-serif'; ctx.fillStyle = '#fff';
      ctx.fillText('扫码一起学画画', qrX + qrSize + 20, qrY + 28);
      ctx.font = '13px "Sora", sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText('开源免费 · 分龄教程 · 徽章成就', qrX + qrSize + 20, qrY + 52);
      ctx.font = '11px "Sora", sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillText('github.com/shixingya/skia_board', qrX + qrSize + 20, qrY + 72);
      ctx.restore();
    }

    _drawFakeQR(ctx, x, y, size) {
      ctx.save(); ctx.fillStyle = '#1a1a2e';
      const cell = size / 15;
      [[0,0],[11,0],[0,11]].forEach(([cx,cy]) => {
        ctx.fillRect(x + cx*cell, y + cy*cell, cell*4, cell*4);
        ctx.fillStyle = '#fff'; ctx.fillRect(x + (cx+1)*cell, y + (cy+1)*cell, cell*2, cell*2);
        ctx.fillStyle = '#1a1a2e'; ctx.fillRect(x + (cx+1.5)*cell, y + (cy+1.5)*cell, cell, cell);
      });
      let s = 42;
      const rand = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
      for (let i = 0; i < 15; i++) {
        for (let j = 0; j < 15; j++) {
          if ((i < 4 && j < 4) || (i > 10 && j < 4) || (i < 4 && j > 10)) continue;
          if (rand() > 0.55) ctx.fillRect(x + i*cell, y + j*cell, cell*0.9, cell*0.9);
        }
      }
      ctx.restore();
    }

    _roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }

    showPreview(options = {}) {
      const dataUrl = this.generate(options);
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:10000;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;overflow-y:auto;';
      const title = document.createElement('div');
      title.textContent = '📸 分享到朋友圈';
      title.style.cssText = 'color:#fff;font-size:18px;font-weight:600;margin-bottom:16px;';
      const img = document.createElement('img');
      img.src = dataUrl;
      img.style.cssText = 'max-width:320px;width:100%;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.5);';
      const hint = document.createElement('div');
      hint.textContent = '长按图片保存，然后发朋友圈';
      hint.style.cssText = 'color:rgba(255,255,255,0.6);font-size:13px;margin-top:16px;';
      const btnRow = document.createElement('div');
      btnRow.style.cssText = 'display:flex;gap:12px;margin-top:20px;';
      const downloadBtn = document.createElement('button');
      downloadBtn.textContent = '💾 保存图片';
      downloadBtn.style.cssText = 'background:linear-gradient(135deg,#7c6fcd,#4ecdc4);color:#fff;border:none;padding:10px 24px;border-radius:8px;font-size:14px;cursor:pointer;font-weight:600;';
      downloadBtn.onclick = () => { const a = document.createElement('a'); a.download = 'skiaboard-share.png'; a.href = dataUrl; a.click(); };
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '关闭';
      closeBtn.style.cssText = 'background:rgba(255,255,255,0.15);color:#fff;border:1px solid rgba(255,255,255,0.3);padding:10px 24px;border-radius:8px;font-size:14px;cursor:pointer;';
      closeBtn.onclick = () => document.body.removeChild(overlay);
      btnRow.appendChild(downloadBtn); btnRow.appendChild(closeBtn);
      overlay.appendChild(title); overlay.appendChild(img); overlay.appendChild(hint); overlay.appendChild(btnRow);
      overlay.onclick = (e) => { if (e.target === overlay) document.body.removeChild(overlay); };
      document.body.appendChild(overlay);
      if (window.badgeManager) window.badgeManager.recordShare();
      return dataUrl;
    }
  }

  window.shareGenerator = new ShareGenerator();

})();
