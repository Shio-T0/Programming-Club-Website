/* CANVAS */

let canvas = document.getElementById("canvas");

let ctx = canvas.getContext("2d");

let WINDOW_HEIGHT = window.innerHeight;
let WINDOW_WIDTH = window.innerWidth;

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
    constructor(startX, startY, radius, speed, color) {
        this.startX = startX;
        this.posX = startX;

        this.startY = startY;
        this.posY = startY;

        this.radius = radius;
        this.color = color;

        this.dy = 1 * speed
        this.dx = 1 * speed

        this.opacity = (Math.random() * (0.90 - 0.10 + 1) - 0.10);
        this.blur = 20
        this.preset = randomNumber(1, 4);
        this.trail = [];
        this.maxTrailLength = 500;

    }

    draw(ctx) {
        if (this.trail.length > 1) {
            ctx.beginPath();
            ctx.globalAlpha = this.opacity;
            ctx.strokeStyle = "#6B52AF";
            ctx.lineWidth = 2;

            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }

            ctx.stroke();
            ctx.closePath();
        }
    }

    path() {
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
    }

    update() {
        if (this.posY >= -500) {
            this.path();

            this.trail.push({ x: this.posX, y: this.posY });
            if (this.trail.length > this.maxTrailLength) {
                this.trail.shift();
            }

            this.draw(ctx)
        }
        else {
            this.trail = []
            this.posY = this.startY;
            this.posX = this.startX;
        }





    }
}


let genCircles = function (color, speed, size) {
    for (let i = 0; i < Math.floor((WINDOW_WIDTH / 20)); i++) {
        let circle = new Circle(50 * i - 100, randomNumber(300, WINDOW_HEIGHT), size, speed, color);
        circle_list.push(circle);
        circle.draw(ctx);
    }
}


function resizeCanvas() {
    WINDOW_HEIGHT = window.innerHeight;
    WINDOW_WIDTH = window.innerWidth;
    const dpr = window.devicePixelRatio || 1;

    canvas.style.width = `${WINDOW_WIDTH}px`;
    canvas.style.height = `${WINDOW_HEIGHT}px`;
    canvas.height = WINDOW_HEIGHT;
    canvas.width = WINDOW_WIDTH;

    canvas.width = canvas.width * dpr;
    canvas.height = canvas.height * dpr;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    circle_list = []
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    genCircles("black", 1, 3);
}

resizeCanvas()
addEventListener("resize", resizeCanvas);


let canvasAnimation = function () {
    requestAnimationFrame(canvasAnimation);
    ctx.clearRect(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT);

    circle_list.forEach(circle => circle.update(ctx))

}

canvasAnimation();

/* Carousel */
let current_index = 0;

function senseChooser() {
    if (current_index >= maxIndex) {
        current_index = -1;
    }
    return "down"

}

function swipe(sense) {

    if (!sense) {
        sense = senseChooser();
    }

    if (sense === "down") {
        current_index++;
    }
    if (sense === "up") {
        current_index--;
    }


    if (current_index < 0) {
        current_index = 0
    }

    if (current_index >= maxIndex) {
        current_index = maxIndex
    }
    slider.style.transition = 'transform ease 1s';
    slider.style.transform = `translateY(-${card_height * current_index}px)`;


}
const card_height = document.querySelector(".card").offsetHeight;
const next_card_btn_top = document.getElementById('next_card_btn_top');
const next_card_btn_bottom = document.getElementById('next_card_btn_bottom');
const slider = document.getElementById('slider');
const maxIndex = slider.children.length - 1;
let swipe_timeout_id


next_card_btn_bottom.addEventListener('click', () => swipe("down"))


next_card_btn_top.addEventListener('click', () => swipe("up"))

function loopWidthTimeout() {
    swipe_timeout_id = setTimeout(loopWidthTimeout, 10000);
    swipe()

}
loopWidthTimeout();

document.getElementById('slider-section').addEventListener('mouseenter', () => {
    clearTimeout(swipe_timeout_id)
});
document.getElementById('slider-section').addEventListener('mouseleave', () => {
    swipe_timeout_id = setTimeout(loopWidthTimeout, 5000);
})


