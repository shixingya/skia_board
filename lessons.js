/**
 * SkiaBoard 内置简笔画教程库
 * 教程格式标准化，社区可按此格式贡献更多教程
 */
window.LESSONS = (function () {

  function circle(ctx, cx, cy, r, fill, stroke, sw) {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = sw || 3; ctx.stroke(); }
  }
  function line(ctx, x1, y1, x2, y2, color, sw) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.strokeStyle = color || '#333'; ctx.lineWidth = sw || 3; ctx.lineCap = 'round'; ctx.stroke();
  }
  function rect(ctx, x, y, w, h, fill, stroke, sw) {
    if (fill) { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = sw || 3; ctx.strokeRect(x, y, w, h); }
  }

  const lessons = [
    {
      id: 'sun', title: '太阳公公', ageGroup: 'kindergarten', ageLabel: '幼儿园',
      difficulty: 1, duration: 3, emoji: '☀️', description: '用圆形和直线画一个笑眯眯的太阳',
      steps: [
        { hint: '第1步：在中间画一个大大的圆形，这是太阳的脸', draw: (ctx) => { circle(ctx, 200, 200, 80, '#FFD93D', '#E8A317', 4); } },
        { hint: '第2步：在太阳周围画 8 条直线，这是太阳的光芒', draw: (ctx) => {
          circle(ctx, 200, 200, 80, '#FFD93D', '#E8A317', 4);
          for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; line(ctx, 200+Math.cos(a)*100, 200+Math.sin(a)*100, 200+Math.cos(a)*140, 200+Math.sin(a)*140, '#E8A317', 5); }
        }},
        { hint: '第3步：画上弯弯的眼睛和微笑的嘴巴', draw: (ctx) => {
          circle(ctx, 200, 200, 80, '#FFD93D', '#E8A317', 4);
          for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; line(ctx, 200+Math.cos(a)*100, 200+Math.sin(a)*100, 200+Math.cos(a)*140, 200+Math.sin(a)*140, '#E8A317', 5); }
          ctx.beginPath(); ctx.arc(175, 190, 8, 0, Math.PI); ctx.strokeStyle = '#333'; ctx.lineWidth = 3; ctx.stroke();
          ctx.beginPath(); ctx.arc(225, 190, 8, 0, Math.PI); ctx.stroke();
          ctx.beginPath(); ctx.arc(200, 210, 25, 0.2*Math.PI, 0.8*Math.PI); ctx.strokeStyle = '#333'; ctx.lineWidth = 3; ctx.stroke();
        }}
      ],
      finalDraw: (ctx) => {
        circle(ctx, 200, 200, 80, '#FFD93D', '#E8A317', 4);
        for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; line(ctx, 200+Math.cos(a)*100, 200+Math.sin(a)*100, 200+Math.cos(a)*140, 200+Math.sin(a)*140, '#E8A317', 5); }
        ctx.beginPath(); ctx.arc(175, 190, 8, 0, Math.PI); ctx.strokeStyle = '#333'; ctx.lineWidth = 3; ctx.stroke();
        ctx.beginPath(); ctx.arc(225, 190, 8, 0, Math.PI); ctx.stroke();
        ctx.beginPath(); ctx.arc(200, 210, 25, 0.2*Math.PI, 0.8*Math.PI); ctx.strokeStyle = '#333'; ctx.lineWidth = 3; ctx.stroke();
        circle(ctx, 165, 215, 8, 'rgba(255,150,150,0.5)');
        circle(ctx, 235, 215, 8, 'rgba(255,150,150,0.5)');
      }
    },
    {
      id: 'apple', title: '红苹果', ageGroup: 'kindergarten', ageLabel: '幼儿园',
      difficulty: 1, duration: 3, emoji: '🍎', description: '画一个又大又红的苹果',
      steps: [
        { hint: '第1步：画一个圆形，这是苹果的身体', draw: (ctx) => { circle(ctx, 200, 220, 90, '#FF6B6B', '#C0392B', 4); } },
        { hint: '第2步：在顶部画一个小棕色的柄', draw: (ctx) => { circle(ctx, 200, 220, 90, '#FF6B6B', '#C0392B', 4); line(ctx, 200, 135, 210, 105, '#8B4513', 6); } },
        { hint: '第3步：在柄旁边画一片绿色的叶子', draw: (ctx) => {
          circle(ctx, 200, 220, 90, '#FF6B6B', '#C0392B', 4); line(ctx, 200, 135, 210, 105, '#8B4513', 6);
          ctx.beginPath(); ctx.ellipse(235, 115, 30, 15, -0.4, 0, Math.PI * 2);
          ctx.fillStyle = '#2ECC71'; ctx.fill(); ctx.strokeStyle = '#27AE60'; ctx.lineWidth = 3; ctx.stroke();
        }}
      ],
      finalDraw: (ctx) => {
        circle(ctx, 200, 220, 90, '#FF6B6B', '#C0392B', 4); line(ctx, 200, 135, 210, 105, '#8B4513', 6);
        ctx.beginPath(); ctx.ellipse(235, 115, 30, 15, -0.4, 0, Math.PI * 2);
        ctx.fillStyle = '#2ECC71'; ctx.fill(); ctx.strokeStyle = '#27AE60'; ctx.lineWidth = 3; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(170, 190, 20, 30, -0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fill();
      }
    },
    {
      id: 'fish', title: '小鱼游游', ageGroup: 'primary', ageLabel: '小学',
      difficulty: 2, duration: 5, emoji: '🐟', description: '用椭圆和三角形画一条可爱的小鱼',
      steps: [
        { hint: '第1步：画一个椭圆形，这是鱼的身体', draw: (ctx) => { ctx.beginPath(); ctx.ellipse(180, 200, 100, 65, 0, 0, Math.PI*2); ctx.fillStyle = '#5DADE2'; ctx.fill(); ctx.strokeStyle = '#2980B9'; ctx.lineWidth = 4; ctx.stroke(); } },
        { hint: '第2步：在右边画一个三角形，这是鱼尾巴', draw: (ctx) => {
          ctx.beginPath(); ctx.ellipse(180, 200, 100, 65, 0, 0, Math.PI*2); ctx.fillStyle = '#5DADE2'; ctx.fill(); ctx.strokeStyle = '#2980B9'; ctx.lineWidth = 4; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(270,200); ctx.lineTo(340,150); ctx.lineTo(340,250); ctx.closePath();
          ctx.fillStyle = '#5DADE2'; ctx.fill(); ctx.strokeStyle = '#2980B9'; ctx.lineWidth = 4; ctx.stroke();
        }},
        { hint: '第3步：画上眼睛、鱼鳍和鱼鳞', draw: (ctx) => {
          ctx.beginPath(); ctx.ellipse(180, 200, 100, 65, 0, 0, Math.PI*2); ctx.fillStyle = '#5DADE2'; ctx.fill(); ctx.strokeStyle = '#2980B9'; ctx.lineWidth = 4; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(270,200); ctx.lineTo(340,150); ctx.lineTo(340,250); ctx.closePath();
          ctx.fillStyle = '#5DADE2'; ctx.fill(); ctx.strokeStyle = '#2980B9'; ctx.lineWidth = 4; ctx.stroke();
          circle(ctx, 140, 185, 12, '#fff', '#333', 2); circle(ctx, 140, 185, 6, '#333');
          ctx.beginPath(); ctx.moveTo(180,260); ctx.quadraticCurveTo(200,300,220,260);
          ctx.fillStyle = '#3498DB'; ctx.fill(); ctx.strokeStyle = '#2980B9'; ctx.lineWidth = 3; ctx.stroke();
          for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(200+i*25, 200, 12, 0.5*Math.PI, 1.5*Math.PI); ctx.strokeStyle = '#2980B9'; ctx.lineWidth = 2; ctx.stroke(); }
        }}
      ],
      finalDraw: (ctx) => {
        circle(ctx, 100, 120, 8, 'rgba(155,220,255,0.5)', '#85C1E9', 2);
        circle(ctx, 80, 90, 5, 'rgba(155,220,255,0.5)', '#85C1E9', 2);
        ctx.beginPath(); ctx.ellipse(180, 200, 100, 65, 0, 0, Math.PI*2); ctx.fillStyle = '#5DADE2'; ctx.fill(); ctx.strokeStyle = '#2980B9'; ctx.lineWidth = 4; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(270,200); ctx.lineTo(340,150); ctx.lineTo(340,250); ctx.closePath();
        ctx.fillStyle = '#5DADE2'; ctx.fill(); ctx.strokeStyle = '#2980B9'; ctx.lineWidth = 4; ctx.stroke();
        circle(ctx, 140, 185, 12, '#fff', '#333', 2); circle(ctx, 140, 185, 6, '#333');
        ctx.beginPath(); ctx.moveTo(180,260); ctx.quadraticCurveTo(200,300,220,260);
        ctx.fillStyle = '#3498DB'; ctx.fill(); ctx.strokeStyle = '#2980B9'; ctx.lineWidth = 3; ctx.stroke();
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(200+i*25, 200, 12, 0.5*Math.PI, 1.5*Math.PI); ctx.strokeStyle = '#2980B9'; ctx.lineWidth = 2; ctx.stroke(); }
      }
    },
    {
      id: 'house', title: '小房子', ageGroup: 'primary', ageLabel: '小学',
      difficulty: 2, duration: 5, emoji: '🏠', description: '用长方形和三角形画一座温馨的小房子',
      steps: [
        { hint: '第1步：画一个长方形，这是房子的墙', draw: (ctx) => { rect(ctx, 120, 200, 180, 140, '#F5CBA7', '#A04000', 4); } },
        { hint: '第2步：在上面画一个三角形，这是屋顶', draw: (ctx) => {
          rect(ctx, 120, 200, 180, 140, '#F5CBA7', '#A04000', 4);
          ctx.beginPath(); ctx.moveTo(100,200); ctx.lineTo(210,120); ctx.lineTo(320,200); ctx.closePath();
          ctx.fillStyle = '#E74C3C'; ctx.fill(); ctx.strokeStyle = '#922B21'; ctx.lineWidth = 4; ctx.stroke();
        }},
        { hint: '第3步：画上门和窗户，再加上烟囱', draw: (ctx) => {
          rect(ctx, 120, 200, 180, 140, '#F5CBA7', '#A04000', 4);
          ctx.beginPath(); ctx.moveTo(100,200); ctx.lineTo(210,120); ctx.lineTo(320,200); ctx.closePath();
          ctx.fillStyle = '#E74C3C'; ctx.fill(); ctx.strokeStyle = '#922B21'; ctx.lineWidth = 4; ctx.stroke();
          rect(ctx, 190, 260, 50, 80, '#8B4513', '#5D2F0C', 3); circle(ctx, 230, 300, 4, '#FFD700');
          rect(ctx, 140, 230, 40, 40, '#85C1E9', '#2980B9', 3);
          line(ctx, 160, 230, 160, 270, '#2980B9', 2); line(ctx, 140, 250, 180, 250, '#2980B9', 2);
          rect(ctx, 250, 130, 25, 50, '#7F8C8D', '#566573', 3);
        }}
      ],
      finalDraw: (ctx) => {
        rect(ctx, 60, 340, 300, 20, '#2ECC71');
        rect(ctx, 120, 200, 180, 140, '#F5CBA7', '#A04000', 4);
        ctx.beginPath(); ctx.moveTo(100,200); ctx.lineTo(210,120); ctx.lineTo(320,200); ctx.closePath();
        ctx.fillStyle = '#E74C3C'; ctx.fill(); ctx.strokeStyle = '#922B21'; ctx.lineWidth = 4; ctx.stroke();
        rect(ctx, 190, 260, 50, 80, '#8B4513', '#5D2F0C', 3); circle(ctx, 230, 300, 4, '#FFD700');
        rect(ctx, 140, 230, 40, 40, '#85C1E9', '#2980B9', 3);
        line(ctx, 160, 230, 160, 270, '#2980B9', 2); line(ctx, 140, 250, 180, 250, '#2980B9', 2);
        rect(ctx, 250, 130, 25, 50, '#7F8C8D', '#566573', 3);
        circle(ctx, 262, 110, 8, 'rgba(200,200,200,0.6)');
        circle(ctx, 270, 90, 10, 'rgba(200,200,200,0.5)');
      }
    },
    {
      id: 'cube', title: '立方体透视', ageGroup: 'middle', ageLabel: '中学',
      difficulty: 3, duration: 8, emoji: '📦', description: '学习一点透视，画一个立体的立方体',
      steps: [
        { hint: '第1步：画正面的正方形', draw: (ctx) => { rect(ctx, 120, 140, 140, 140, 'rgba(200,200,255,0.3)', '#7c6fcd', 3); } },
        { hint: '第2步：从四个角向右上方画平行线，确定深度', draw: (ctx) => {
          rect(ctx, 120, 140, 140, 140, 'rgba(200,200,255,0.3)', '#7c6fcd', 3);
          const dx=70, dy=-50;
          line(ctx, 120,140, 120+dx,140+dy, '#999', 2); line(ctx, 260,140, 260+dx,140+dy, '#999', 2);
          line(ctx, 120,280, 120+dx,280+dy, '#999', 2); line(ctx, 260,280, 260+dx,280+dy, '#999', 2);
        }},
        { hint: '第3步：连接端点形成背面，区分三个面的明暗', draw: (ctx) => {
          const dx=70, dy=-50;
          rect(ctx, 120, 140, 140, 140, '#D5D8F7', '#7c6fcd', 3);
          ctx.beginPath(); ctx.moveTo(120,140); ctx.lineTo(120+dx,140+dy); ctx.lineTo(260+dx,140+dy); ctx.lineTo(260,140); ctx.closePath();
          ctx.fillStyle = '#EDE7F6'; ctx.fill(); ctx.strokeStyle = '#7c6fcd'; ctx.lineWidth = 3; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(260,140); ctx.lineTo(260+dx,140+dy); ctx.lineTo(260+dx,280+dy); ctx.lineTo(260,280); ctx.closePath();
          ctx.fillStyle = '#B39DDB'; ctx.fill(); ctx.strokeStyle = '#7c6fcd'; ctx.lineWidth = 3; ctx.stroke();
        }}
      ],
      finalDraw: (ctx) => {
        const dx=70, dy=-50;
        rect(ctx, 120, 140, 140, 140, '#D5D8F7', '#7c6fcd', 3);
        ctx.beginPath(); ctx.moveTo(120,140); ctx.lineTo(120+dx,140+dy); ctx.lineTo(260+dx,140+dy); ctx.lineTo(260,140); ctx.closePath();
        ctx.fillStyle = '#EDE7F6'; ctx.fill(); ctx.strokeStyle = '#7c6fcd'; ctx.lineWidth = 3; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(260,140); ctx.lineTo(260+dx,140+dy); ctx.lineTo(260+dx,280+dy); ctx.lineTo(260,280); ctx.closePath();
        ctx.fillStyle = '#B39DDB'; ctx.fill(); ctx.strokeStyle = '#7c6fcd'; ctx.lineWidth = 3; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(120,280); ctx.lineTo(190,310); ctx.lineTo(330,310); ctx.lineTo(260,280); ctx.closePath();
        ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fill();
      }
    },
    {
      id: 'eye', title: 'Q版人物眼睛', ageGroup: 'middle', ageLabel: '中学',
      difficulty: 3, duration: 6, emoji: '👁️', description: '学习漫画风格大眼睛的画法',
      steps: [
        { hint: '第1步：画一个上弯的弧线作为上眼皮', draw: (ctx) => { ctx.beginPath(); ctx.moveTo(100,180); ctx.quadraticCurveTo(200,100,300,180); ctx.strokeStyle = '#2C3E50'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.stroke(); } },
        { hint: '第2步：画一个大圆作为眼球，加上瞳孔和高光', draw: (ctx) => {
          ctx.beginPath(); ctx.moveTo(100,180); ctx.quadraticCurveTo(200,100,300,180); ctx.strokeStyle = '#2C3E50'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.stroke();
          circle(ctx, 200, 220, 65, '#fff', '#2C3E50', 4);
          circle(ctx, 200, 225, 40, '#5DADE2', '#2980B9', 2);
          circle(ctx, 200, 225, 20, '#2C3E50');
          circle(ctx, 180, 205, 12, '#fff');
          circle(ctx, 215, 240, 6, 'rgba(255,255,255,0.7)');
        }},
        { hint: '第3步：画上睫毛和下眼线，完成眼睛', draw: (ctx) => {
          ctx.beginPath(); ctx.moveTo(100,180); ctx.quadraticCurveTo(200,100,300,180); ctx.strokeStyle = '#2C3E50'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.stroke();
          circle(ctx, 200, 220, 65, '#fff', '#2C3E50', 4);
          circle(ctx, 200, 225, 40, '#5DADE2', '#2980B9', 2);
          circle(ctx, 200, 225, 20, '#2C3E50');
          circle(ctx, 180, 205, 12, '#fff');
          circle(ctx, 215, 240, 6, 'rgba(255,255,255,0.7)');
          line(ctx, 120,165, 110,145, '#2C3E50', 4); line(ctx, 160,140, 155,118, '#2C3E50', 4);
          line(ctx, 200,132, 200,108, '#2C3E50', 4); line(ctx, 240,140, 245,118, '#2C3E50', 4);
          line(ctx, 280,165, 290,145, '#2C3E50', 4);
          ctx.beginPath(); ctx.moveTo(140,275); ctx.quadraticCurveTo(200,300,260,275);
          ctx.strokeStyle = '#2C3E50'; ctx.lineWidth = 3; ctx.stroke();
        }}
      ],
      finalDraw: (ctx) => {
        ctx.beginPath(); ctx.moveTo(100,180); ctx.quadraticCurveTo(200,100,300,180); ctx.strokeStyle = '#2C3E50'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.stroke();
        circle(ctx, 200, 220, 65, '#fff', '#2C3E50', 4);
        circle(ctx, 200, 225, 40, '#5DADE2', '#2980B9', 2);
        circle(ctx, 200, 225, 20, '#2C3E50');
        circle(ctx, 180, 205, 12, '#fff');
        circle(ctx, 215, 240, 6, 'rgba(255,255,255,0.7)');
        line(ctx, 120,165, 110,145, '#2C3E50', 4); line(ctx, 160,140, 155,118, '#2C3E50', 4);
        line(ctx, 200,132, 200,108, '#2C3E50', 4); line(ctx, 240,140, 245,118, '#2C3E50', 4);
        line(ctx, 280,165, 290,145, '#2C3E50', 4);
        ctx.beginPath(); ctx.moveTo(140,275); ctx.quadraticCurveTo(200,300,260,275);
        ctx.strokeStyle = '#2C3E50'; ctx.lineWidth = 3; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(110,90); ctx.quadraticCurveTo(200,60,290,90);
        ctx.strokeStyle = '#2C3E50'; ctx.lineWidth = 5; ctx.stroke();
      }
    },
    {
      id: 'zentangle', title: '禅绕曼陀罗', ageGroup: 'adult', ageLabel: '成人',
      difficulty: 4, duration: 15, emoji: '🌀', description: '用重复的几何图案创作解压禅绕画',
      steps: [
        { hint: '第1步：画一个中心圆和外圈，确定曼陀罗范围', draw: (ctx) => { circle(ctx, 200, 200, 150, null, '#7c6fcd', 2); circle(ctx, 200, 200, 30, null, '#7c6fcd', 2); } },
        { hint: '第2步：将圆环分成 8 等份，画分割线', draw: (ctx) => {
          circle(ctx, 200, 200, 150, null, '#7c6fcd', 2); circle(ctx, 200, 200, 30, null, '#7c6fcd', 2);
          for (let i = 0; i < 8; i++) { const a = (i/8)*Math.PI*2; line(ctx, 200+Math.cos(a)*30, 200+Math.sin(a)*30, 200+Math.cos(a)*150, 200+Math.sin(a)*150, '#7c6fcd', 1.5); }
        }},
        { hint: '第3步：在每个扇形中填充重复的小图案（弧线/圆点/三角）', draw: (ctx) => {
          circle(ctx, 200, 200, 150, null, '#7c6fcd', 2); circle(ctx, 200, 200, 30, '#7c6fcd', '#7c6fcd', 2);
          for (let i = 0; i < 8; i++) {
            const a = (i/8)*Math.PI*2;
            line(ctx, 200+Math.cos(a)*30, 200+Math.sin(a)*30, 200+Math.cos(a)*150, 200+Math.sin(a)*150, '#bbb', 1);
            for (let r = 50; r < 140; r += 25) { ctx.beginPath(); ctx.arc(200, 200, r, a+0.05, a+(Math.PI/4)-0.05); ctx.strokeStyle = '#7c6fcd'; ctx.lineWidth = 2; ctx.stroke(); }
            const ma = a + Math.PI/8;
            circle(ctx, 200+Math.cos(ma)*90, 200+Math.sin(ma)*90, 5, '#4ecdc4');
          }
        }}
      ],
      finalDraw: (ctx) => {
        circle(ctx, 200, 200, 150, '#F8F7FF', '#7c6fcd', 3);
        circle(ctx, 200, 200, 30, '#7c6fcd', '#5a4fae', 2);
        for (let i = 0; i < 8; i++) {
          const a = (i/8)*Math.PI*2;
          line(ctx, 200+Math.cos(a)*30, 200+Math.sin(a)*30, 200+Math.cos(a)*150, 200+Math.sin(a)*150, '#d0c8f0', 1);
          for (let r = 50; r < 140; r += 25) { ctx.beginPath(); ctx.arc(200, 200, r, a+0.05, a+(Math.PI/4)-0.05); ctx.strokeStyle = '#7c6fcd'; ctx.lineWidth = 2; ctx.stroke(); }
          const ma = a + Math.PI/8;
          circle(ctx, 200+Math.cos(ma)*90, 200+Math.sin(ma)*90, 5, '#4ecdc4');
          circle(ctx, 200+Math.cos(ma)*120, 200+Math.sin(ma)*120, 3, '#FFD93D');
        }
        circle(ctx, 200, 200, 15, '#fff');
      }
    },
    {
      id: 'coffee', title: '手账咖啡杯', ageGroup: 'adult', ageLabel: '成人',
      difficulty: 2, duration: 5, emoji: '☕', description: '画一个简约风格的咖啡杯，适合手账和笔记',
      steps: [
        { hint: '第1步：画一个梯形作为杯身', draw: (ctx) => { ctx.beginPath(); ctx.moveTo(140,160); ctx.lineTo(260,160); ctx.lineTo(245,300); ctx.lineTo(155,300); ctx.closePath(); ctx.fillStyle = '#F5E6D3'; ctx.fill(); ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 3; ctx.stroke(); } },
        { hint: '第2步：画杯把手和顶部的咖啡液面', draw: (ctx) => {
          ctx.beginPath(); ctx.moveTo(140,160); ctx.lineTo(260,160); ctx.lineTo(245,300); ctx.lineTo(155,300); ctx.closePath(); ctx.fillStyle = '#F5E6D3'; ctx.fill(); ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 3; ctx.stroke();
          ctx.beginPath(); ctx.ellipse(290, 220, 30, 45, 0, -0.5*Math.PI, 0.5*Math.PI); ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 6; ctx.stroke();
          ctx.beginPath(); ctx.ellipse(200, 160, 60, 12, 0, 0, Math.PI*2); ctx.fillStyle = '#6F4E37'; ctx.fill();
        }},
        { hint: '第3步：加上热气和碟子，完成手账风咖啡杯', draw: (ctx) => {
          ctx.beginPath(); ctx.moveTo(140,160); ctx.lineTo(260,160); ctx.lineTo(245,300); ctx.lineTo(155,300); ctx.closePath(); ctx.fillStyle = '#F5E6D3'; ctx.fill(); ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 3; ctx.stroke();
          ctx.beginPath(); ctx.ellipse(290, 220, 30, 45, 0, -0.5*Math.PI, 0.5*Math.PI); ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 6; ctx.stroke();
          ctx.beginPath(); ctx.ellipse(200, 160, 60, 12, 0, 0, Math.PI*2); ctx.fillStyle = '#6F4E37'; ctx.fill();
          ctx.beginPath(); ctx.moveTo(180,140); ctx.bezierCurveTo(170,120,190,110,180,90);
          ctx.moveTo(200,140); ctx.bezierCurveTo(210,120,190,110,200,85);
          ctx.moveTo(220,140); ctx.bezierCurveTo(230,120,210,110,220,90);
          ctx.strokeStyle = '#aaa'; ctx.lineWidth = 2; ctx.stroke();
          ctx.beginPath(); ctx.ellipse(200, 310, 100, 15, 0, 0, Math.PI*2); ctx.fillStyle = '#E8D5B7'; ctx.fill(); ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 3; ctx.stroke();
        }}
      ],
      finalDraw: (ctx) => {
        ctx.beginPath(); ctx.ellipse(200, 310, 100, 15, 0, 0, Math.PI*2); ctx.fillStyle = '#E8D5B7'; ctx.fill(); ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 3; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(140,160); ctx.lineTo(260,160); ctx.lineTo(245,300); ctx.lineTo(155,300); ctx.closePath(); ctx.fillStyle = '#F5E6D3'; ctx.fill(); ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 3; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(290, 220, 30, 45, 0, -0.5*Math.PI, 0.5*Math.PI); ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 6; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(200, 160, 60, 12, 0, 0, Math.PI*2); ctx.fillStyle = '#6F4E37'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(180,140); ctx.bezierCurveTo(170,120,190,110,180,90);
        ctx.moveTo(200,140); ctx.bezierCurveTo(210,120,190,110,200,85);
        ctx.moveTo(220,140); ctx.bezierCurveTo(230,120,210,110,220,90);
        ctx.strokeStyle = '#aaa'; ctx.lineWidth = 2; ctx.stroke();
      }
    }
  ];

  return lessons;
})();
