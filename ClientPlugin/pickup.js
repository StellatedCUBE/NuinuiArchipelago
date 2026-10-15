import { getIcon, marginBottom } from './icon.js';
import { itemTextParticle } from './patch.js';

export class APPickup extends Actor {
	yos = 0;
	sound = 'jingle';

	checkHit = _ => false;

	constructor(pos, apLocation, ephemeral) {
		super(pos, new Vector2(20, 20));
		this.apLocation = apLocation;
		this.isPersistent = !ephemeral;
		this.toFilter = !archipelagoState.checkAvailable(apLocation);
	}

	shouldPickUp() {
		return CollisionBox.intersects(this, NNM.getPlayer()) && !NNM.game.scene.bossKillEffect;
	}

	collect(game) {
		const scout = archipelagoState.getScout(this.apLocation);
		if (scout?.local && scout.id === (11 << 16)) {
			new Heart(NNM.getPlayer().pos).update(game);
			archipelagoState.bufferedHearts--;
			archipelagoState.check(this.apLocation, true);
		} else {
			game.scene.particles.sparkle_white(CollisionBox.center(this));
			const jingle = !scout || !scout.local || scout.id > 999;
			if (jingle) game.playSound(scout?.local && scout.id === (10 << 16) ? 'cling2' : this.sound);
			else if (scout?.local && scout.id < 999) archipelagoState.dueCrystalPopup += scout.id;
			archipelagoState.check(this.apLocation, this.noPopup || !jingle || (scout.local && scout.id === (10 << 16)));
		}
	}
	
	sparkle(game) {
		if (!(this.frameCount % 24)) game.scene.particles.shine_white(new Vector2(this.pos.x + 10, this.pos.y + this.yos + 10), 1);
	}

	update = game => {
		this.yos += Math.cos(this.frameCount * 3 * (Math.PI / 180)) / 4;
		this.frameCount++;
		this.sparkle(game);
		if (this.shouldPickUp()) {
			this.toFilter = true;
			this.draw = _ => {};
			this.collect(game);
		} else {
			this.move();
		}
	}

	move() {}

	getScout() {
		return archipelagoState.scouts[this.apLocation];
	}

	draw = (game, cx) => {
		cx.save();
		cx.translate(Math.round(this.pos.x), Math.round(this.pos.y));
		const scout = this.getScout();
		let img = game.assets.images.NNM_Archipelago_logo, rect;
		if (scout?.game === 'FLARE NUINUI QUEST') {
			[img, rect] = getIcon(scout.id, true);
			if (scout.sender.slot !== scout.receiver.slot && scout.sender.slot)
				cx.drawImage(game.assets.images.NNM_Archipelago_logo, 2, 2);
		}
		const yos = Math.round(this.yos);
		if (rect) {
			cx.drawImage(img, rect[0], rect[1], rect[2], rect[3], 10 - (rect[2] >> 1), yos + 10 - (rect[3] >> 1), rect[2], rect[3]);
			if (rect[2] > 24 - [2, 15].includes(scout.id >> 16) && scout.sender.slot !== scout.receiver.slot)
				cx.drawImage(game.assets.images.NNM_Archipelago_logo, 2, yos + 2);
		} else {
			cx.drawImage(img, 10 - (img.width >> 1), yos + 10 - (img.height >> 1));
		}
		cx.restore();
	}
}

export class BossDrop extends APPickup {
	#yVel = 0;

	constructor(pos) {
		super(pos, (4 << 16) | archipelagoState.arenaId);
		if (this.toFilter && archipelagoState.arenaId === 23) archipelagoState.getCrystals(200);
	}

	shouldPickUp() {
		return NNM.getPlayer().playerControl && super.shouldPickUp();
	}

	move() {
		if (!CollisionBox.collidesWith(this, NNM.game.scene.currentSection)) {
			if (this.apLocation === ((4 << 16) | 11))
				this.pos.y -= NNM.game.height;
			else
				return;
		}
		if (this.pos.y < NNM.game.scene.view.pos.y - 32)
			this.pos.y = NNM.game.scene.view.pos.y - 32;
		let targetYVel = 16;
		const size = {x: 1, y: 1};
		for (let x = this.pos.x - 38; x < this.pos.x + 60; x += 16) {
			if (
				x === this.pos.x + 10 ?
				CollisionBox.intersectCollisions({pos: {x, y: this.pos.y}, size: {x: 1, y: 96}}, NNM.game.scene.collisions).length :
				(!CollisionBox.intersectCollisions({pos: {x, y: this.pos.y + 10}, size}, NNM.game.scene.collisions).length && CollisionBox.intersectCollisions({pos: {x, y: this.pos.y + 96}, size}, NNM.game.scene.collisions).length)
			) {
				targetYVel = 0;
				break;
			}
		}
		this.#yVel += Math.sign(targetYVel - this.#yVel);
		this.pos.y += this.#yVel * 0.07;
	}
}

export class NoelDrop extends APPickup {
	constructor(event) {
		super(new Vector2(NNM.getPlayer().pos.x - 2, 0), 6);
		this.event = event;
	}

	move() {
		this.yos = 0;
		this.pos.y = NNM.getPlayer().pos.y - 4 * (60 - this.event.timelineFrame) - 10;
	}
}

export class NousagiItem extends APPickup {
	#cage;
	#yVel = 1.5;
	#canPickUp = false;

	constructor(cage, loc) {
		super(cage.pos.plus({x: -2, y: -6}), loc, true);
		this.#cage = cage;
	}

	shouldPickUp() {
		return this.#canPickUp || super.shouldPickUp();
	}

	move() {
		if (this.#cage.health)
			this.yos = 0;
		else {
			if (!this.#canPickUp) this.frameCount = 0;
			this.#canPickUp = true;
			this.pos.y -= Math.max(0, this.#yVel);
			this.#yVel -= .05;
		}
	}
}

export class HoloXDrop extends APPickup {
	constructor(pos, apLocation) {
		super(pos, apLocation);
		const superDraw = this.draw;
		this.draw = (game, cx) => NNM.getPlayer().playerControl ? superDraw(game, cx) : (this.frameCount = 1, this.yos = 0);
	}
}

export class FallsWeapon extends APPickup {
	constructor(pos) {
		super(pos, 0);
		this.toFilter = false;
	}

	getScout() {
		return archipelagoState.firstWeapon;
	}

	collect(game) {
		archipelagoState.collectFirstWeapon();
		game.playSound('jingle');
	}
}

export class SmallPickup extends APPickup {
	#moved;
	sound = 'heal';
	noPopup = true;

	constructor(pos, apLocation) {
		super(pos, apLocation, true);
		this.size.x = this.size.y = 8;
	}

	move() {
		if (!this.#moved) {
			const box = {pos: this.pos.plus({x: 0, y: 1}), size: this.size};
			while (!CollisionBox.intersectCollisions(box, NNM.game.scene.currentSection.collisions).length) box.pos.y++;
			this.pos.y = box.pos.y - 1;
			this.#moved = true;
		}
	}

	sparkle(game) {
		if (!(this.frameCount % 16)) game.scene.particles.charge(CollisionBox.center(this));
	}

	collect(game) {
		super.collect(game);
		const scout = archipelagoState.getScout(this.apLocation);
		if (scout && !archipelagoState.pendingPopUp && !(scout.local && [0, 10, 11, 14].includes(scout.id >> 16)))
			itemTextParticle(NNM.getPlayer(), this.apLocation);
	}
	
	draw = (game, cx) => {
		cx.save();
		cx.translate(this.pos.x, this.pos.y);
		const scout = this.getScout();
		let img, rect, yos = 0;
		if (scout?.game === 'FLARE NUINUI QUEST') {
			if (scout.id === 14 << 16) {
				cx.drawImage(NNM.game.assets.images.NNM_Archipelago_alt_small, 0, 0);
				return cx.restore();
			}
			[img, rect] = getIcon(scout.id, true);
			yos = marginBottom[scout.id] || 0;
			if (scout.sender.slot !== scout.receiver.slot && scout.sender.slot)
				cx.drawImage(game.assets.images.NNM_Archipelago_crate, 0, 0);
		}
		if (!img || img === game.assets.images.NNM_Archipelago_logo) img = game.assets.images.NNM_Archipelago_crate;
		if (rect) {
			cx.drawImage(img, rect[0], rect[1], rect[2], rect[3], 4 - (rect[2] >> 1), 8 - rect[3] + yos, rect[2], rect[3]);
		} else {
			cx.drawImage(img, 4 - (img.width >> 1), 8 - img.height + yos);
		}
		cx.restore();
	}
}

export class WorldText extends Actor {
	checkHit = _ => false;

	constructor(pos, text) {
		super(pos, Vector2.zero);
		this.text = new TextElem(NNM.game, [...text], { lang: 'en', textAlign: 'center' });
	}

	update = game => game.scene.customDraw.push(game => this.text.draw(game, game.ctx1, this.pos.plus(game.scene.view.pos.times(-1))));
}
