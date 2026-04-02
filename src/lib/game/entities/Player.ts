// src/lib/game/entities/Player.ts
export class Player {
    x: number;
    y: number; // 通常固定在水面高度 (例如 100)
    baseY: number; // 基準Y位置（不包含漂浮效果）
    width: number = 300;
    height: number = 300;
    speed: number = 10;
    facingDirection: number = 1; // 1: 面向右, -1: 面向左
    
    // 漂浮動畫相關
    floatOffset: number = 0;
    floatAmplitude: number = 30; // 漂浮幅度
    floatSpeed: number = 0.03; // 漂浮速度

    // 圖片支援
    image: HTMLImageElement;
    isImageLoaded: boolean = false;

    constructor(canvasWidth: number, waterLevel: number = 110) {
        this.x = canvasWidth / 2; // 初始在中間
        // 讓船浮在水面上，底部吃水約 1/4 高度
        const underwaterDepth = this.height * 0.65; // 船底部 25% 在水下
        this.baseY = waterLevel - underwaterDepth; // 設置基準Y位置
        this.y = this.baseY; // 初始Y位置等於基準位置
        
        // 載入圖片
        this.image = new Image();
        this.image.src = '/player.png'; // 預設路徑 pointing to static/player.png
        this.image.onload = () => {
            this.isImageLoaded = true;
        };
    }

    // 取得竿頭位置 (讓魚鉤知道要從哪裡發射/收回)
    // 偏移量依照 player.png 圖片中魚竿頭的相對位置調整
    // x: 根據朝向調整釣竿頂端位置, y: 調整到釣竿頂端
    getRodTipPosition() {
        // 根據玩家朝向調整釣竿頂端的水平位置
        let rodTipX;
        if (this.facingDirection === -1) {
            // 面向右：釣竿在右側
            rodTipX = this.x + this.width * 0.9;
        } else {
            // 面向左：釣竿在左側
            rodTipX = this.x + this.width * 0.1;
        }
        
        return {
            x: rodTipX,
            y: this.y + this.height * 0.3
        };
    }

    // 更新位置 (左右移動)
    update(input: { left: boolean, right: boolean }, canvasWidth: number) {
        if (input.left) {
            this.x -= this.speed;
            this.facingDirection = 1; // 面向左
        }
        if (input.right) {
            this.x += this.speed;
            this.facingDirection = -1; // 面向右
        }

        // 邊界檢查 (不要開出畫面)
        this.x = Math.max(0, Math.min(this.x, canvasWidth - this.width));        
        // 更新漂浮動畫
        this.floatOffset += this.floatSpeed;
        this.y = this.baseY + Math.sin(this.floatOffset) * this.floatAmplitude;    }

    
    draw(ctx: CanvasRenderingContext2D) {
        if (this.isImageLoaded) {
            ctx.save(); // 保存畫布狀態
            
            // 移動原點到玩家中心以便翻轉
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            ctx.translate(centerX, centerY);
            
            // 根據朝向翻轉圖片
            ctx.scale(this.facingDirection, 1);
            
            // 實作 Object-fit: Cover 效果 (填滿區塊且維持比例，裁切多餘部分)
            const imgRatio = this.image.width / this.image.height;
            const targetRatio = this.width / this.height;

            let sWidth, sHeight, sx, sy;

            if (imgRatio > targetRatio) {
                // 圖片比較寬：以高度為基準，裁切左右
                sHeight = this.image.height;
                sWidth = sHeight * targetRatio;
                sy = 0;
                sx = (this.image.width - sWidth) / 2;
            } else {
                // 圖片比較高：以寬度為基準，裁切上下
                sWidth = this.image.width;
                sHeight = sWidth / targetRatio;
                sx = 0;
                sy = (this.image.height - sHeight) / 2;
            }

            // 因為原點在中心，繪製位置要調整為 (-width/2, -height/2)
            ctx.drawImage(
                this.image, 
                sx, sy, sWidth, sHeight, // 來源裁切 (Crop)
                -this.width / 2, -this.height / 2, this.width, this.height // 目標繪製
            );
            
            ctx.restore(); // 恢復畫布狀態
        } else {
            // 沒有圖片時的備用繪製（也要考慮轉向）
            ctx.save();
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            ctx.translate(centerX, centerY);
            ctx.scale(this.facingDirection, 1);
            
            ctx.fillStyle = 'brown'; // 畫船
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
            
            ctx.restore();
        }
    }
}