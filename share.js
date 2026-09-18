/**
 * SkiaBoard 朋友圈分享图生成
 * 生成精美的竖版分享卡片，包含作品、徽章、二维码
 */
(function () {

  const CARD_W = 750;
  const CARD_H = 1000;

  class ShareGenerator {

    generate(options = {}) {
      const canvas = document.createElement('canvas');
      canvas.width = CARD_W;
      canvas.height = CARD_H;
      const ctx = canvas.getContext('2d');
      this._drawBackground(ctx);
      this._drawHeader(ctx);
      const artworkBottom = this._drawArtwork(ctx, options.sourceCanvas);
      let cursorY = artworkBottom + 30;
      cursorY = this._drawAchievementText(ctx, options, cursorY);
      if (options.badges && options.badges.length > 0) cursorY = this._drawBadges(ctx, options.badges, cursorY);
      this._drawFooter(ctx);
      return canvas.toDataURL('image/png');
    }

    _drawBackground(ctx) {
      const grad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
      grad.addColorStop(0, '#1a1a2e');
      grad.addColorStop(0.5, '#16213e');
      grad.addColorStop(1, '#0f3460');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CARD_W, CARD_H);
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.beginPath(); ctx.arc(0, 0, 200, 0, Math.PI * 2); ctx.fillStyle = '#7c6fcd'; ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = 0.1;
      ctx.beginPath(); ctx.arc(CARD_W, CARD_H, 250, 0, Math.PI * 2); ctx.fillStyle = '#4ecdc4'; ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = '#fff';
      [[80,120],[650,80],[120,850],[680,700],[50,500],[700,400]].forEach(([x,y]) => { ctx.beginPath(); ctx.arc(x,y,2,0,Math.PI*2); ctx.fill(); });
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

    _drawArtwork(ctx, sourceCanvas) {
      const cardX = 50, cardY = 145, cardW = CARD_W - 100, cardH = 420;
      ctx.save();
      this._roundRect(ctx, cardX, cardY, cardW, cardH, 20);
      ctx.fillStyle = '#f8f8fc'; ctx.fill();
      ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 5; ctx.fill();
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

    _drawAchievementText(ctx, options, y) {
      ctx.save(); ctx.textAlign = 'center';
      if (options.lessonTitle) {
        ctx.font = 'bold 26px "Sora", sans-serif'; ctx.fillStyle = '#fff';
        ctx.fillText(`我完成了「${options.lessonTitle}」`, CARD_W / 2, y); y += 38;
        ctx.font = '15px "Sora", sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillText('在 SkiaBoard 跟着教程学画画', CARD_W / 2, y); y += 30;
      } else {
        ctx.font = 'bold 26px "Sora", sans-serif'; ctx.fillStyle = '#fff';
        ctx.fillText('我的绘画作品', CARD_W / 2, y); y += 38;
        ctx.font = '15px "Sora", sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillText('用 SkiaBoard 画的，快来一起试试！', CARD_W / 2, y); y += 30;
      }
      ctx.restore(); return y;
    }

    _drawBadges(ctx, badges, y) {
      ctx.save(); ctx.textAlign = 'center';
      ctx.font = '13px "Sora", sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText('✨ 新获得徽章', CARD_W / 2, y); y += 30;
      const badgeSize = 70, gap = 20;
      const totalW = badges.length * badgeSize + (badges.length - 1) * gap;
      let startX = (CARD_W - totalW) / 2;
      badges.slice(0, 4).forEach(badge => {
        const cx = startX + badgeSize / 2, cy = y + badgeSize / 2;
        const grad = ctx.createRadialGradient(cx - 10, cy - 10, 5, cx, cy, badgeSize / 2);
        grad.addColorStop(0, badge.gradient ? badge.gradient[0] : '#ffd700');
        grad.addColorStop(1, badge.gradient ? badge.gradient[1] : '#ff8c00');
        ctx.beginPath(); ctx.arc(cx, cy, badgeSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = grad; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.stroke();
        ctx.font = '30px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(badge.emoji || '🏅', cx, cy);
        ctx.font = '11px "Sora", sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.textBaseline = 'alphabetic';
        ctx.fillText(badge.name, cx, y + badgeSize + 16);
        startX += badgeSize + gap;
      });
      ctx.restore(); return y + badgeSize + 35;
    }

    _drawFooter(ctx) {
      const footerY = CARD_H - 130;
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(40, footerY); ctx.lineTo(CARD_W - 40, footerY); ctx.stroke();
      ctx.restore();
      const qrSize = 80, qrX = 60, qrY = footerY + 25;
      ctx.save();
      this._roundRect(ctx, qrX, qrY, qrSize, qrSize, 8);
      ctx.fillStyle = '#fff'; ctx.fill();
      ctx.restore();
      this._drawFakeQR(ctx, qrX + 8, qrY + 8, qrSize - 16);
      ctx.save(); ctx.textAlign = 'left';
      ctx.font = 'bold 18px "Sora", sans-serif'; ctx.fillStyle = '#fff';
      ctx.fillText('扫码一起学画画', qrX + qrSize + 20, qrY + 30);
      ctx.font = '13px "Sora", sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText('开源免费 · 多人协作 · 分龄教程', qrX + qrSize + 20, qrY + 55);
      ctx.font = '11px "Sora", sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillText('github.com/shixingya/skia_board', qrX + qrSize + 20, qrY + 75);
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
      overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:10000;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;';
      const title = document.createElement('div');
      title.textContent = '📸 分享到朋友圈';
      title.style.cssText = 'color:#fff;font-size:18px;font-weight:600;margin-bottom:16px;';
      const img = document.createElement('img');
      img.src = dataUrl;
      img.style.cssText = 'max-width:340px;width:100%;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.5);';
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
