import { Player } from './entities/Player';
import { Hook } from './entities/Hook';
import { Fish } from './entities/Fish';
import { Bowl } from './entities/Bowl';
// import { game } from '../game.svelte'; // 移除全域引用，改用回呼函數

// 1. 定義輸入狀態介面 (讓 TypeScript 知道有哪些按鍵)
export interface InputState {
    left: boolean;
    right: boolean;
    cast: boolean; // 拋竿/收線鍵 (例如空白鍵)
}

export class GameEngine {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D; // ★ 新增：繪圖筆刷

    defaultDepth: number;
    waterLevel: number = 300; // 水面高度 (Y 座標)
    player: Player;
    hook: Hook;
    bowl: Bowl;
    fishes: Fish[] = [];
    
    // 回呼函數：當分數改變時通知外部
    onScoreUpdate: (amount: number) => void;
    // 回呼函數：音效事件通知
    onSfx: ((event: 'reel' | 'catch' | 'score') => void) | null = null;
    
    // 波浪動畫變數
    waveOffset: number = 0;
    
    // ★ 新增：背景圖片資源
    skyImage: HTMLImageElement | null = null;
    seaBottomImage: HTMLImageElement | null = null;
    imagesLoaded: boolean = false;

    // ★ 新增：輸入狀態儲存區
    input: InputState = {
        left: false,
        right: false,
        cast: false
    };

    constructor(canvas: HTMLCanvasElement, onScoreUpdate: (amount: number) => void, fishCount: number = 10) {
        // ★ 補上：取得 context，並用 ! 告訴 TS 這一定存在
        this.ctx = canvas.getContext('2d')!;
        this.canvas = canvas;
        this.onScoreUpdate = onScoreUpdate; // 儲存回呼函數
        this.defaultDepth = canvas.height * 0.9; // 設定在畫面 90% 的深度
        
        // ★ 新增：載入背景圖片
        this.loadBackgroundImages();
        
        // 初始化物件
        this.player = new Player(canvas.width, this.waterLevel);
        const rodTip = this.player.getRodTipPosition();
        this.hook = new Hook(rodTip.x, this.defaultDepth, this.waterLevel);
        this.bowl = new Bowl(canvas.width, this.waterLevel);

        // 生成魚群
        for(let i = 0; i < fishCount; i++) {
            this.fishes.push(new Fish(canvas.width, canvas.height));
        }
    }

    // ★ 新增：載入背景圖片的方法
    private loadBackgroundImages() {
        let loadCount = 0;
        const totalImages = 2;

        const onImageLoad = () => {
            loadCount++;
            if (loadCount === totalImages) {
                this.imagesLoaded = true;
            }
        };

        // 載入天空背景圖片
        this.skyImage = new Image();
        this.skyImage.onload = onImageLoad;
        this.skyImage.src = '/sky-bg.png'; // 請將圖片放在 static 資料夾中

        // 載入海底背景圖片  
        this.seaBottomImage = new Image();
        this.seaBottomImage.onload = onImageLoad;
        this.seaBottomImage.src = '/seabottom-bg.png'; // 請將圖片放在 static 資料夾中
    }

    // ★ 新增：檢查背景圖片是否已載入完成的方法
    public areImagesLoaded(): boolean {
        return this.imagesLoaded;
    }

    // ★ 新增：提供給 Svelte 呼叫的輸入處理方法
    handleInput(key: string, isPressed: boolean) {
        switch(key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                this.input.left = isPressed;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                this.input.right = isPressed;
                break;
            case ' ':
            case 'Enter':
                this.input.cast = isPressed;
                break;
        }
    }

    update() {
        // 1. 更新船的位置
        this.player.update(this.input, this.canvas.width);
        
        // 取得竿頭位置 (這是鉤子要跟隨的目標)
        const rodTip = this.player.getRodTipPosition();

        // 2. 處理輸入 (拋竿邏輯)
        // 只有在 idle 狀態下按空白鍵才有效
        if (this.input.cast && (this.hook.state === 'idle' || this.hook.state === 'sinking')) {
            this.hook.reel();
            // 只有在釣竿真的被拉起（state 確實變成 reeling）時才觸發音效
            if (this.hook.state === 'reeling') {
                this.onSfx?.('reel');
            }
        }
        
        if (this.hook.state === 'reeling') {
            this.checkCollisions();
        }
        if (this.hook.state === 'sinking') {
            this.checkBowlCollision();
        }

        // 3. 更新鉤子 (無論什麼狀態，都傳入 rodTip.x 讓它去跟隨)
        // ★ 修正：這裡不再需要 if (idle) else ... 的判斷了，全部交給 Hook 內部處理
        this.hook.update(rodTip.x);

        // 5. 更新碗
        this.bowl.update(this.canvas.width);
        this.fishes.forEach(fish => fish.update(this.canvas.width));
    }

    // ★ 新增：繪圖方法 (Svelte 的 Loop 要呼叫這個)
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 1. 畫天空背景
        if (this.imagesLoaded && this.skyImage) {
            // 使用圖片作為天空背景，拉伸到畫面寬度和水面高度
            this.ctx.drawImage(this.skyImage, 0, 0, this.canvas.width, this.waterLevel);
        } else {
            // 圖片未載入時的備用樣式
            this.ctx.fillStyle = '#E0F7FA'; // 淡藍色天空
            this.ctx.fillRect(0, 0, this.canvas.width, this.waterLevel);
        }

        // 2. 畫海底背景
        if (this.imagesLoaded && this.seaBottomImage) {
            // 使用圖片作為海底背景，從水面以下開始
            this.ctx.drawImage(
                this.seaBottomImage, 
                0, this.waterLevel, 
                this.canvas.width, 
                this.canvas.height - this.waterLevel
            );
        } else {
            // 圖片未載入時的備用樣式
            this.ctx.fillStyle = '#a8e6cf';
            this.ctx.fillRect(0, this.waterLevel, this.canvas.width, this.canvas.height - this.waterLevel);
        }

        // 更新波浪偏移 (控制波浪速度)
        this.waveOffset += 0.03;

        // 3. 畫動態水面 (使用 Sine Wave) - 這會覆蓋在背景圖片上方
        this.ctx.fillStyle = 'rgba(168, 230, 207, 0.6)'; // 半透明的水面顏色
        this.ctx.beginPath();
        
        let waveHeight = 10; // 波浪起伏高度
        let waveLength = 0.01; // 波浪寬度係數

        // 從畫面左邊畫到右邊
        for (let x = 0; x <= this.canvas.width; x += 10) {
            // y = center + sin(angle) * amplitude
            const y = this.waterLevel + Math.sin(x * waveLength + this.waveOffset) * waveHeight;
            
            if (x === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        // 封閉路徑以填充顏色 (畫到右下跟左下)
        this.ctx.lineTo(this.canvas.width, this.canvas.height);
        this.ctx.lineTo(0, this.canvas.height);
        this.ctx.closePath();
        this.ctx.fill();

        // 4. 畫波浪邊緣線 (選擇性)
        this.ctx.beginPath();
        for (let x = 0; x <= this.canvas.width; x += 10) {
            const y = this.waterLevel + Math.sin(x * waveLength + this.waveOffset) * waveHeight;
            if (x === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        this.ctx.strokeStyle = '#88c0a8';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.bowl.draw(this.ctx);
        this.player.draw(this.ctx);
        this.fishes.forEach(fish => fish.draw(this.ctx));

        // ★ 修改：傳入竿頭位置來畫線
        const rodTip = this.player.getRodTipPosition();
        this.hook.draw(this.ctx, rodTip.x, rodTip.y);
    }

    checkBowlCollision() {
        // 檢查是否有魚被釣到
        if (this.hook.caughtFish.length === 0) {
            return;
        }

        // 縮小碗的碰撞框，讓魚只能在碗口區域計分
        // 水平範圍：縮小到碗寬度的中間 60%
        const bowlCenterX = this.bowl.x + this.bowl.width / 2;
        const bowlOpeningWidth = this.bowl.width * 0.6; // 碗口寬度為總寬度的 60%
        const inHorizontalRange = this.hook.x >= (bowlCenterX - bowlOpeningWidth / 2) && 
                                 this.hook.x <= (bowlCenterX + bowlOpeningWidth / 2);
        
        // 垂直範圍：只檢測碗口附近的小範圍（碗頂部到碗深度的 30%）
        const bowlOpeningDepth = this.bowl.height * 0.3; // 碗口深度為總高度的 30%
        const inVerticalRange = this.hook.y >= this.bowl.y && 
                               this.hook.y <= this.bowl.y + bowlOpeningDepth;

        if (inHorizontalRange && inVerticalRange) {
            // ★ 只有魚鉤向下移動時（由上往下進入碗）才計分
            if (this.hook.vy > 0) {
                // 加分：呼叫外部傳入的回呼函數
                const amount = this.hook.caughtFish.length;
                if (amount > 0) {
                    this.onScoreUpdate(amount);
                    this.onSfx?.('score');
                }
                
                // 讓魚消失 (重生)
                this.hook.caughtFish.forEach(fish => fish.startRespawn());
                
                // 清空鉤子上的魚
                this.hook.caughtFish = [];
            }
            // 如果魚鉤向上移動（vy <= 0），則不計分，魚繼續留在魚鉤上
        }
    }

    // ★ 實作：碰撞偵測邏輯
    checkCollisions() {
        // 單次能抓的魚上限為五隻
        if (this.hook.caughtFish.length > 5) return;

        for (const fish of this.fishes) {
            // 如果這條魚已經被抓了，跳過
            if (fish.isCaught) continue;

            const bounds = fish.getBounds(); // 假設 Fish 有這個方法
            
            // 簡單的矩形碰撞檢查 (Hook 視為一個點，或小矩形)
            // 判斷 Hook 的尖端是否在魚的身體範圍內
            if (
                this.hook.x >= bounds.x - 20 &&
                this.hook.x <= bounds.x + bounds.w + 20 &&
                this.hook.y >= bounds.y - 20 &&
                this.hook.y <= bounds.y + bounds.h + 20
            ) {
                // 1. 觸發魚的被抓狀態
                fish.onCaught(this.hook);
                // 播放釣到魚音效
                this.onSfx?.('catch');
                
                // 2. 觸發鉤子的狀態 (設定 caughtFish 並開始收線)
                this.hook.caughtFish.push(fish);
                this.hook.reel(); // 自動收線

                // 一次只能釣一隻，跳出迴圈
                break; 
            }
        }
    }
}