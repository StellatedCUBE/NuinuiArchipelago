export class TextParticle {
	life = 0;
	lifespan = 1;
	zIndex = 2;

	constructor(pos, text, textAlign, yvel) {
		this.pos = pos;
		this.labels = text.map(l => new TextElem(NNM.game, [...l], {lang: 'en', textAlign}));
		this.size = new Vector2(Math.max(...this.labels.map(l => l.width)), this.labels.length * 8);
		this.yvel = yvel;
		this.a = 1.3;
		if (textAlign === 'center') {
			const x1 = pos.x;
			const x2 = NNM.game.scene.currentSection.pos.x + this.size.x / 2 + 8;
			const x3 = NNM.game.scene.currentSection.pos.x + NNM.game.scene.currentSection.size.x - this.size.x / 2 - 8;
			pos.x = Math.max(Math.min(x1, x2), Math.min(Math.max(x1, x2), x3));
		}
	}

	draw(cx) {
		if (this.a <= 0) {
			this.life = 2;
			return;
		}
		const vp = NNM.game.scene.view.pos.times(-1).round();
		let y = 0|(this.pos.y - this.size.y / 2) + vp.y;
		cx.globalAlpha = Math.min(this.a, 1);
		for (const l of this.labels) {
			l.draw(NNM.game, cx, {x: 0|this.pos.x + vp.x, y});
			y += 8;
		}
		cx.globalAlpha = 1;
	}

	update() {
		this.pos.y += this.yvel;
		this.a -= 0.01;
	}
}
