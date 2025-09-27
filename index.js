
/* CANVAS */

let canvas = document.getElementById("canvas");

let ctx = canvas.getContext("2d");

const WINDOW_HEIGHT = window.innerHeight;
const WINDOW_WIDTH = window.innerWidth;

canvas.height = WINDOW_HEIGHT;
canvas.width = WINDOW_WIDTH;

let circle_list = [];


const DISLOCATIONS = {
    1: [
        [800, 840], [620, 670], [500, 540], // ➡ right dislocations
        [700, 730], [430, 470], [300, 320]  // ⬅ left dislocations
    ],

    2: [
        [790, 830], [590, 610], [430, 470], // ➡ right dislocations
        [750, 780], [460, 520], [360, 400]  // ⬅ left dislocations
    ],

    3: [
        [690, 740], [520, 560], [310, 350], // ➡ right dislocations
        [640, 670], [400, 430], [180, 250]  // ⬅ left dislocations
    ],

    4: [
        [720, 760], [600, 630], [270, 300], // ➡ right dislocations
        [680, 710], [470, 490], [320, 370]  // ⬅ left dislocations
    ],

    5: [
        [750, 780], [620, 650], [400, 430], // ➡ right dislocations
        [680, 730], [500, 520], [310, 330]  // ⬅ left dislocations
    ],

    6: [
        [780, 820], [540, 580], [350, 390], // ➡ right dislocations
        [620, 660], [430, 500], [200, 230]  // ⬅ left dislocations
    ],

    7: [
        [800, 840], [700, 730], [520, 560], // ➡ right dislocations
        [740, 790], [600, 620], [340, 420]  // ⬅ left dislocations
    ]
}






let randomNumber = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

class Circle {
    constructor(posX, posY, radius, speed, color) {
        this.posX = posX;
        this.posY = posY;
        this.radius = radius;
        this.color = color;

        this.dy = 1 * speed
        this.dx = 1 * speed

        this.opacity = (Math.random() * (0.9 + 1 ));
        this.preset = randomNumber(1, 4);
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.globalAlpha = this.opacity;
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.arc(this.posX, this.posY, this.radius,0,  Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }
    
    update(ctx) {
        this.posY -= this.dy;
        if (
            (this.posY >= DISLOCATIONS[this.preset][0][0] && this.posY < DISLOCATIONS[this.preset][0][1])
            ||
            (this.posY >= DISLOCATIONS[this.preset][1][0] && this.posY < DISLOCATIONS[this.preset][1][1])
            ||
            (this.posY >= DISLOCATIONS[this.preset][2][0] && this.posY < DISLOCATIONS[this.preset][2][1])
            ) {
            this.posX += this.dx;
        }

        if (
            (this.posY >= DISLOCATIONS[this.preset][3][0] && this.posY < DISLOCATIONS[this.preset][3][1])
            ||
            (this.posY >= DISLOCATIONS[this.preset][4][0] && this.posY < DISLOCATIONS[this.preset][4][1])
            ||
            (this.posY >= DISLOCATIONS[this.preset][5][0] && this.posY < DISLOCATIONS[this.preset][5][1])
        ) {
            this.posX -= this.dx;
        }
        if (this.posY >= 0) {
            this.draw(ctx)
        }


    }
}


let genCircles = function (color, speed, size) {
    for (let i = 0; i < Math.floor((WINDOW_WIDTH / 20)); i++) {
        let circle = new Circle( 50 * i - 100, randomNumber(300, 990), size, speed, color);
        circle_list.push(circle);
        circle.draw(ctx);
    }
}

genCircles("#6B52AF", 1, 1.5);

let canvasAnimation = function () {
    requestAnimationFrame(canvasAnimation);


    circle_list.forEach(circle => circle.update(ctx))
}

canvasAnimation();
