import type { Hook } from "./Hook";

// src/lib/game/entities/Fish.ts
export class Fish {
    x: number = 0;
    y: number = 0;
    width: number = 150;
    height: number = 75;
    maxWidth: number = 150; // 最大寬度限制
    speed: number = 0;
    isCaught: boolean = false; // 狀態標記
    attachedHook: Hook | null = null; // 釣到的 Hook
    
    // 重生相關
    isRespawning: boolean = false;
    respawnTimer: number = 0;
    canvasWidth: number = 0;
    canvasHeight: number = 0;

    // 圖片支援
    image: HTMLImageElement;
    isImageLoaded: boolean = false;

    constructor(cw: number, ch: number, maxWidth: number = 150) {
        this.canvasWidth = cw;
        this.canvasHeight = ch;
        this.maxWidth = maxWidth;
        
        // 載入圖片 (請確保在 static 資料夾中有 fish.png)
        this.image = new Image();
        this.image.src = this.selectFish(Math.floor(Math.random() * 3) + 1); // 隨機選擇魚的種類
        this.image.onload = () => {
            this.isImageLoaded = true;
            // 計算等比例縮放尺寸
            this.calculateScaledSize();
        };

        // NOTE: 初始化魚的大小與游動速度
        this.resetPosition();
    }

    resetPosition() {
        // 修改重生位置：中間 1/2 區域 (左右各留 1/4)
        // 起點從 0.25 開始，長度為 0.5
        this.x = (this.canvasWidth * 0.25) + Math.random() * (this.canvasWidth * 0.5);

        // 修改高度生成範圍：下半部生成，但底部留 1/10 空白 (海床)
        const spawnTop = this.canvasHeight / 2; // 從畫面一半開始
        const spawnBottom = this.canvasHeight * 0.9; // 到底部 90% 處停止 (留 10%)
        const spawnRange = spawnBottom - spawnTop;
        
        this.y = spawnTop + Math.random() * spawnRange; 
        
        this.speed = Math.random() * 2 + (Math.random() * 10 - 6); // -5 到 +5 的速度
        this.isCaught = false;
        this.attachedHook = null;
        this.isRespawning = false;
    }

    // 計算等比例縮放尺寸
    calculateScaledSize() {
        if (!this.isImageLoaded) return;
        
        const originalWidth = this.image.naturalWidth;
        const originalHeight = this.image.naturalHeight;
        
        if (originalWidth === 0 || originalHeight === 0) return;
        
        // 根據最大寬度計算縮放比例
        const scale = this.maxWidth / originalWidth;
        
        // 等比例縮放
        this.width = originalWidth * scale;
        this.height = originalHeight * scale;
    }

    onCaught(hook: Hook) {
        this.isCaught = true;
        this.attachedHook = hook;
    }

    onReleased(hook: Hook) {
        this.x = hook.x;
        this.y = hook.y + Math.random() * -30; // 放開時稍微在鉤子下方
        this.isCaught = false;
        this.attachedHook = null;
    }
    
    // 開始重生倒數
    startRespawn() {
        this.isCaught = false;
        this.attachedHook = null;
        this.isRespawning = true;
        // 移出畫面
        this.x = -9999;
        this.y = -9999;
        // 設定隨機重生時間 (例如 60 ~ 180 幀，約 1~3 秒)
        this.respawnTimer = 60 + Math.random() * 120;
    }

    // 取得魚的邊界 (用於碰撞檢測)
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            w: this.width,
            h: this.height
        };
    }

    update(canvasWidth: number) {
        // ★ 核心邏輯分支
        if (this.isRespawning) {
            this.respawnTimer--;
            if (this.respawnTimer <= 0) {
                this.resetPosition();
            }
            return;
        }

        if (this.isCaught && this.attachedHook) {
            // [情況 A：被抓到了]
            // 跟隨邏輯：讓魚鉤位於魚的圖片中間
            // ★ 修改：加入顫抖掙扎效果 (隨機偏移 -2 到 +2 px)
            const shakeIntensity = 10;
            const shakeX = (Math.random() - 0.5) * shakeIntensity;
            const shakeY = (Math.random() - 0.5) * shakeIntensity;

            // 讓魚鉤位於魚的中心位置
            this.x = this.attachedHook.x - (this.width / 2) + shakeX;
            this.y = this.attachedHook.y - (this.height / 2) + shakeY;
        } else {
            // [情況 B：自由自在]
            // 原本的游動邏輯
            this.x += this.speed;
            
            // 碰到邊緣反彈
            if (this.x > canvasWidth - this.width || this.x < 0) {
                this.speed *= -1;
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.isRespawning) return; // 重生中不畫

        ctx.save(); // 保存目前的畫布狀態

        // 1. 移動原點到魚的中心 (方便旋轉與翻轉)
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        ctx.translate(centerX, centerY);

        if (this.isCaught) {
             // 掙扎效果
             const rotation = (Math.random() - 0.5) * 0.2;
             ctx.rotate(rotation);
        } else {
             // 游動時的轉向 (翻轉圖片)
             // 假設魚的預設圖片是朝「左」的
             if (this.speed > 0) {
                 // 向右游 -> 水平翻轉
                 ctx.scale(-1, 1);
             } else {
                 // 向左游 -> 保持原樣
                 ctx.scale(1, 1);
             }
        }

        // 因為原點在中心，所以繪製座標要是 (-w/2, -h/2)
        if (this.isImageLoaded) {
            ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            ctx.fillStyle = this.isCaught ? 'red' : 'orange'; 
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        }

        ctx.restore(); // 恢復畫布狀態
    }

    selectFish(type: number): string {
        switch(type) {
            case 1:
                return '/fish1.png';
            case 2:
                return '/fish2.png';
            case 3:
                return '/fish3.png';
            default:
                return '/fish.png';
        }
    }
}