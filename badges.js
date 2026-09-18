/**
 * SkiaBoard 徽章系统
 * 负责徽章定义、解锁检测、持久化存储、解锁事件通知
 */
(function () {

  const STORAGE_KEY = 'skiaboard_badges_v1';

  const BADGE_DEFINITIONS = [
    { id: 'first_stroke', name: '初次落笔', emoji: '🌱', description: '完成你的第一幅画作', tip: '画点什么然后点击"完成"吧！', rarity: 'common', gradient: ['#a8e6cf', '#56ab2f'] },
    { id: 'three_day', name: '三日坚持', emoji: '🔥', description: '连续 3 天练习绘画', tip: '每天画一点，坚持就是胜利', rarity: 'rare', gradient: ['#ffd89b', '#ff6b6b'] },
    { id: 'five_lessons', name: '勤学小将', emoji: '📚', description: '完成 5 篇教程', tip: '在学练模式中跟着教程画画', rarity: 'common', gradient: ['#a1c4fd', '#4ecdc4'] },
    { id: 'ten_lessons', name: '十课达人', emoji: '⭐', description: '完成 10 篇教程', tip: '已经是绘画小达人了！', rarity: 'rare', gradient: ['#fceabb', '#f8b500'] },
    { id: 'speed_demon', name: '进步神速', emoji: '🚀', description: '一天内完成 3 篇教程', tip: '今天状态爆棚！', rarity: 'epic', gradient: ['#ff9a9e', '#7c6fcd'] },
    { id: 'color_master', name: '色彩大师', emoji: '🎨', description: '一幅画中使用 5 种以上颜色', tip: '大胆用色，让作品更精彩', rarity: 'rare', gradient: ['#f093fb', '#f5576c'] },
    { id: 'sharer', name: '传播使者', emoji: '📣', description: '将作品分享到朋友圈', tip: '让更多人看到你的作品', rarity: 'epic', gradient: ['#4facfe', '#00f2fe'] },
    { id: 'little_painter', name: '小小画家', emoji: '🏆', description: '完成幼儿园全部课程', tip: '幼儿园系列全部通关！', rarity: 'epic', gradient: ['#fa709a', '#fee140'] },
    { id: 'all_rounder', name: '全面发展', emoji: '🌈', description: '四个学段各完成至少 1 篇教程', tip: '幼儿园、小学、中学、成人都试试', rarity: 'legendary', gradient: ['#667eea', '#f093fb'] },
    { id: 'master', name: '绘画大师', emoji: '👑', description: '解锁全部徽章', tip: '终极成就，你就是大师！', rarity: 'legendary', gradient: ['#f5af19', '#f12711'] }
  ];

  const RARITY_LABELS = { common: '普通', rare: '稀有', epic: '史诗', legendary: '传说' };

  class BadgeManager {
    constructor() {
      this.data = this._load();
      this.listeners = [];
    }

    _load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return { unlocked: {}, stats: { totalDrawings: 0, lessonsCompleted: {}, practiceDates: [], shareCount: 0, maxColorsInOneDrawing: 0 } };
    }

    _save() {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data)); } catch (e) {}
    }

    onUnlock(callback) { this.listeners.push(callback); }

    _notify(badge) { this.listeners.forEach(cb => { try { cb(badge); } catch (e) { console.error(e); } }); }

    _unlock(badgeId) {
      if (this.data.unlocked[badgeId]) return false;
      const badge = BADGE_DEFINITIONS.find(b => b.id === badgeId);
      if (!badge) return false;
      this.data.unlocked[badgeId] = { unlockedAt: Date.now() };
      this._save();
      this._notify(badge);
      return true;
    }

    getAll() {
      return BADGE_DEFINITIONS.map(b => ({ ...b, rarityLabel: RARITY_LABELS[b.rarity], unlocked: !!this.data.unlocked[b.id], unlockedAt: this.data.unlocked[b.id]?.unlockedAt || null }));
    }

    getUnlocked() { return this.getAll().filter(b => b.unlocked); }
    getStats() { return { ...this.data.stats }; }

    getStreakDays() {
      const dates = [...this.data.stats.practiceDates].sort().reverse();
      if (dates.length === 0) return 0;
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < dates.length; i++) {
        const d = new Date(dates[i]);
        const expected = new Date(today);
        expected.setDate(today.getDate() - i);
        expected.setHours(0, 0, 0, 0);
        d.setHours(0, 0, 0, 0);
        if (d.getTime() === expected.getTime()) { streak++; }
        else if (i === 0 && d.getTime() < expected.getTime()) {
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          yesterday.setHours(0, 0, 0, 0);
          if (d.getTime() === yesterday.getTime()) { streak = 1; } else { break; }
        } else { break; }
      }
      return streak;
    }

    recordDrawing(colorCount) {
      this.data.stats.totalDrawings++;
      if (colorCount > this.data.stats.maxColorsInOneDrawing) this.data.stats.maxColorsInOneDrawing = colorCount;
      this._recordPracticeDate();
      this._save();
      if (this.data.stats.totalDrawings >= 1) this._unlock('first_stroke');
      if (colorCount >= 5) this._unlock('color_master');
      this._checkStreak();
      this._checkMaster();
    }

    recordLessonComplete(lessonId, ageGroup) {
      if (!this.data.stats.lessonsCompleted[lessonId]) this.data.stats.lessonsCompleted[lessonId] = Date.now();
      this._recordPracticeDate();
      this._save();
      const completedCount = Object.keys(this.data.stats.lessonsCompleted).length;
      if (completedCount >= 5) this._unlock('five_lessons');
      if (completedCount >= 10) this._unlock('ten_lessons');
      const today = new Date().toDateString();
      const todayCount = Object.values(this.data.stats.lessonsCompleted).filter(t => new Date(t).toDateString() === today).length;
      if (todayCount >= 3) this._unlock('speed_demon');
      const kgLessons = (window.LESSONS || []).filter(l => l.ageGroup === 'kindergarten');
      const kgCompleted = kgLessons.filter(l => this.data.stats.lessonsCompleted[l.id]).length;
      if (kgLessons.length > 0 && kgCompleted >= kgLessons.length) this._unlock('little_painter');
      const ageGroups = ['kindergarten', 'primary', 'middle', 'adult'];
      const allAgeGroupsCovered = ageGroups.every(ag => (window.LESSONS || []).some(l => l.ageGroup === ag && this.data.stats.lessonsCompleted[l.id]));
      if (allAgeGroupsCovered) this._unlock('all_rounder');
      this._checkStreak();
      this._checkMaster();
    }

    recordShare() {
      this.data.stats.shareCount++;
      this._save();
      this._unlock('sharer');
      this._checkMaster();
    }

    _recordPracticeDate() {
      const today = new Date().toISOString().split('T')[0];
      if (!this.data.stats.practiceDates.includes(today)) this.data.stats.practiceDates.push(today);
    }

    _checkStreak() { if (this.getStreakDays() >= 3) this._unlock('three_day'); }

    _checkMaster() {
      const all = this.getAll();
      const nonMaster = all.filter(b => b.id !== 'master');
      if (nonMaster.every(b => b.unlocked)) this._unlock('master');
    }

    reset() {
      this.data = { unlocked: {}, stats: { totalDrawings: 0, lessonsCompleted: {}, practiceDates: [], shareCount: 0, maxColorsInOneDrawing: 0 } };
      this._save();
    }
  }

  window.badgeManager = new BadgeManager();
  window.BADGE_DEFINITIONS = BADGE_DEFINITIONS;

})();
