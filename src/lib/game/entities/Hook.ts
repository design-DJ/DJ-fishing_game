// src/lib/game/entities/Hook.ts
import type { Fish } from './Fish';

export class Hook {
    x: number;
    y: number;
    vx: number = 0;
    vy: number = 0;
    defaultDepth: number;
    waterLevel: number; // 水面高度 (Y 座標)
    
    // 狀態說明：
    // idle: 在水底漂浮 (跟隨船)
    // reeling: 被拉起 (往上衝)
    // sinking: 掉回水底 (重力下落)
    state: 'idle' | 'reeling' | 'sinking' = 'idle';

    // 物理與動畫參數
    gravity: number = 0.5;
    friction: number = 0.95; // 水阻力 (稍微調大一點，讓它在水底慢一點)
    floatOffset: number = 0; // 用來計算上下浮動的數值

    caughtFish: Fish[] = [];

    constructor(startX: number, startY: number, waterLevel: number = 110) {
        this.x = startX;
        this.y = startY;
        this.defaultDepth = startY;
        this.waterLevel = waterLevel;
    }

    // ★ 新增：漂浮邏輯 (取代原本的 reset)
    // targetX: 船(竿頭)的 X 座標
    // targetY: 想要懸停的水深 (例如水面下 200px)
    float(targetX: number, targetY: number) {
        this.state = 'idle';

        // 1. 水平跟隨 (Lerp 演算法)
        // 數學原理：目前的 X += (目標 X - 目前 X) * 係數
        // 係數 0.05 代表每幀移動 5% 的距離 -> 產生拖曳感
        this.x += (targetX - this.x) * 0.05;

        // 2. 垂直浮動 (Sine Wave)
        // 讓魚鉤在目標深度上下 5px 浮動
        this.floatOffset += 0.05;
        this.y = targetY + Math.sin(this.floatOffset) * 5;

        // 漂浮時速度歸零 (避免干擾物理)
        this.vx = 0;
        this.vy = 0;
    }

    backToIdle() {
        this.state = 'idle';
        this.y = this.defaultDepth; // 強制校正位置，避免穿透
        this.vx = 0;
        this.vy = 0;
        this.caughtFish = []; // 著陸後放開魚 (或依需求調整)
    }

    // 發動攻擊：往上拉
    reel() {
        // 魚鉤要下沉到一定深度才能拉起
        if (this.y <= this.waterLevel * 1.5) return;
        this.state = 'reeling';
        this.vy = -30; // 給一個強大的向上力道
    }

    // 攻擊結束：往下掉
    sink() {
        this.state = 'sinking';
    }

    update(targetX: number) {
        
        // --- 1. X 軸邏輯 (永遠跟隨) ---
        // 使用 Lerp 演算法讓鉤子「拖」著走，而不是瞬間移動
        // 係數 0.1 代表跟隨速度 (0.01 慢/慣性大 <---> 1.0 瞬間同步)
        const followSpeed = 0.03; 
        this.x += (targetX - this.x) * followSpeed;


        // --- 2. Y 軸邏輯 (看狀態) ---
        switch (this.state) {
            case 'idle':
                // 漂浮模式：在預設深度做正弦波震動
                this.floatOffset += 0.05;
                // 讓 y 緩慢回到預設深度 (如果剛掉下來有點誤差的話) + 震動
                this.y += (this.defaultDepth - this.y) * 0.1; 
                this.y += Math.sin(this.floatOffset) * 1.2;
                break;

            case 'reeling':
            case 'sinking':
                // 物理模式：應用重力與速度
                this.vy += this.gravity;
                this.y += this.vy;
                break;
        }

        // --- 3. 邊界與狀態切換檢查 ---
        
        // 狀況 A: 下沉到底部 -> 變回 Idle
        if (this.state === 'sinking' && this.y >= this.defaultDepth && this.vy > 0) {
            this.state = 'idle';
            this.vy = 0;
            this.y = this.defaultDepth; // 強制校正
            
            // 讓魚重生 (消失)
            // this.caughtFish.forEach(fish => fish.startRespawn());
            this.caughtFish.forEach((fish) => {
                fish.onReleased(this);
                this.caughtFish = [];
            });
        }

        // 狀況 B: 收線衝出水面 -> 變回 Sinking (掉下來)
        // 假設水面高度是 100
        if (this.state === 'reeling' && this.y < this.waterLevel * 0.6) {
            this.sink();
        }

        // --- 4. 魚跟隨邏輯 ---
        if (this.caughtFish.length > 0) {
            this.caughtFish.forEach(fish => {
                fish.x = this.x - (fish.width / 2);
                fish.y = this.y + 10;
            });
        }
    }

    // ★ 修改：Draw 接收 rodX, rodY 以便畫線
    draw(ctx: CanvasRenderingContext2D, rodX: number, rodY: number) {
        // 1. 畫釣魚線 (連接竿頭跟魚鉤)
        ctx.beginPath();
        ctx.moveTo(rodX, rodY); // 起點：竿頭
        ctx.lineTo(this.x, this.y); // 終點：魚鉤
        ctx.lineWidth = 2; // 稍微加粗
        ctx.strokeStyle = 'rgba(40, 40, 40, 0.6)'; // 更明顯的深色線
        ctx.stroke();

        // 2. 畫魚鉤
        ctx.strokeStyle = this.state === 'reeling' ? 'red' : 'gray';
        ctx.fillStyle = this.state === 'reeling' ? 'red' : 'gray';
        ctx.lineWidth = 2;
        
        // 畫魚鉤形狀
        ctx.beginPath();
        
        // 魚鉤的主體 (垂直線)
        ctx.moveTo(this.x, this.y - 8);
        ctx.lineTo(this.x, this.y + 8);
        
        // 魚鉤的彎曲部分 (鉤子)
        ctx.moveTo(this.x, this.y + 8);
        ctx.quadraticCurveTo(this.x + 6, this.y + 8, this.x + 6, this.y + 2);
        
        // 魚鉤的尖端
        ctx.moveTo(this.x + 6, this.y + 2);
        ctx.lineTo(this.x + 4, this.y);
        
        // 魚鉤的倒刺
        ctx.moveTo(this.x + 4, this.y);
        ctx.lineTo(this.x + 3, this.y - 1);
        
        ctx.stroke();
        
        // 畫魚鉤的連接點 (小圓點)
        ctx.beginPath();
        ctx.arc(this.x, this.y - 8, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}