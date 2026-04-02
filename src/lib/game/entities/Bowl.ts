export class Bowl {
    x: number;
    y: number;
    width: number = 500;
    height: number = 300;
    
    // 用於控制隨機移動的變數
    speed: number = 0.3;
    vx: number = 1; 
    directionChangeTimer: number = 0;

    // 圖片支援
    image: HTMLImageElement;
    isImageLoaded: boolean = false;

    constructor(canvasWidth: number, waterLevel: number = 110) {
        // 隨機初始位置：控制在畫面中間的三分之一
        // 範圍從 1/3 到 2/3
        const startRange = canvasWidth / 3;
        const rangeWidth = canvasWidth / 3;
        this.x = startRange + Math.random() * (rangeWidth - this.width);
        
        this.y = waterLevel * 0.40;
        
        // 載入圖片 (請確保在 static 資料夾中有 bowl.png)
        this.image = new Image();
        this.image.src = '/bowl.png'; 
        this.image.onload = () => {
            this.isImageLoaded = true;
        };
        
        // 隨機初始方向
        this.vx = (Math.random() > 0.5 ? 1 : -1) * this.speed;
    }

    update(canvasWidth: number) {
        // 隨機改變方向邏輯
        this.directionChangeTimer++;
        
        // 每隔一段隨機時間 (約 1~60 幀) 有小機率改變速度或方向
        if (this.directionChangeTimer > 30 && Math.random() < 0.05) {
            // 隨機調整速度 (0.5 ~ 1.5 倍 speed)
            const speedVariation = 0.5 + Math.random(); 
            // 有 10% 機率反向，或者只是改變速度快慢
            if (Math.random() < 0.1) {
                this.vx = -this.vx;
            } else {
                this.vx = (this.vx > 0 ? 1 : -1) * this.speed * speedVariation;
            }
            this.directionChangeTimer = 0;
        }

        this.x += this.vx;

        // 邊界檢查 (碰到牆壁反彈)
        if (this.x < 0) {
            this.x = 0;
            this.vx = Math.abs(this.vx); // 改為向右
        } else if (this.x + this.width > canvasWidth) {
            this.x = canvasWidth - this.width;
            this.vx = -Math.abs(this.vx); // 改為向左
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.isImageLoaded) {
            // 實作 Object-fit: Contain 效果 (完整顯示圖片，維持比例，置中對齊)
            const imgRatio = this.image.width / this.image.height;
            const targetRatio = this.width / this.height;

            let drawWidth, drawHeight, drawX, drawY;

            if (imgRatio > targetRatio) {
                // 圖片比較寬：以寬度為基準，縮放高度
                drawWidth = this.width;
                drawHeight = this.width / imgRatio;
                drawX = this.x;
                drawY = this.y + (this.height - drawHeight) / 2;
            } else {
                // 圖片比較高：以高度為基準，縮放寬度
                drawHeight = this.height;
                drawWidth = this.height * imgRatio;
                drawX = this.x + (this.width - drawWidth) / 2;
                drawY = this.y;
            }

            ctx.drawImage(this.image, drawX, drawY, drawWidth, drawHeight);
        } else {
            // 沒圖片時的備案：畫原本的幾何圖形
            ctx.save();
            
            // 碗的顏色
            ctx.fillStyle = '#E0E0E0'; 
            ctx.strokeStyle = '#666666';
            ctx.lineWidth = 2;

            // 畫半圓形作為碗身
            ctx.beginPath();
            // arc(x, y, radius, startAngle, endAngle)
            // 圓心在 (x + width/2, y)，半徑是 width/2
            ctx.arc(this.x + this.width / 2, this.y, this.width / 2, 0, Math.PI);
            ctx.fill();
            ctx.stroke();

            // 畫碗口的一條線 (增加立體感)
            ctx.beginPath();
            // 畫一個扁橢圓作為開口
            ctx.ellipse(this.x + this.width / 2, this.y, this.width / 2, 5, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#F5F5F5'; // 碗內顏色稍淺
            ctx.fill();
            ctx.stroke();

            ctx.restore();
        }
    }
}
