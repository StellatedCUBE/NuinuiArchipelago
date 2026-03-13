import { getIcon } from './icon.js';

export class APPickup extends Actor {
	yos = 0;
	duringCutscene = true;
	canPickUp = true;

	checkHit = _ => false;

	constructor(pos, apLocation, ephemeral) {
		super(pos, new Vector2(20, 20));
		this.apLocation = apLocation;
		this.isPersistent = !ephemeral;
		this.toFilter = !archipelagoState.client.room.missingLocations.includes(apLocation) || archipelagoState.checking.includes(apLocation);
	}

	update = game => {
		this.yos += Math.cos(this.frameCount * 3 * (Math.PI / 180)) / 4;
		const trap = archipelagoState.scouts[this.apLocation]?.trap;
		if (!(this.frameCount % (24 >> trap))) game.scene.particles[trap ? 'sparkle_fire_4' : 'shine_white'](new Vector2(this.pos.x + 10, this.pos.y + this.yos + 10), 1);
		if (this.canPickUp && CollisionBox.intersects(this, NNM.getPlayer()) && !game.scene.bossKillEffect && (this.duringCutscene || NNM.getPlayer().playerControl)) {
			this.toFilter = true;
			this.draw = _ => {};
			const scout = archipelagoState.scouts[this.apLocation];
			if (scout?.id === (11 << 16) && scout.sender.slot === scout.receiver.slot) {
				new Heart(NNM.getPlayer().pos).update(game);
				archipelagoState.bufferedHearts--;
				archipelagoState.check(this.apLocation, true);
			} else {
				game.scene.particles.sparkle_white(CollisionBox.center(this));
				//if (scout.sender.slot !== scout.receiver.slot || !(this.apLocation < 999 || this.apLocation === (10 << 16))) game.playSound('jingle');
				if (archipelagoState.popupFlag) game.playSound('jingle');
				archipelagoState.check(this.apLocation);
			}
		} else {
			this.move();
		}
		this.frameCount++;
	}

	move() {}

	draw = (game, cx) => {
		cx.save();
		cx.translate(Math.round(this.pos.x), Math.round(this.pos.y));
		const scout = archipelagoState.scouts[this.apLocation];
		let img = game.assets.images.NNM_Archipelago_logo, rect;
		if (scout?.game === 'FLARE NUINUI QUEST') {
			[img, rect] = getIcon(scout.id, true);
			if (scout.sender.slot !== scout.receiver.slot)
				cx.drawImage(game.assets.images.NNM_Archipelago_logo, 2, 2);
		}
		const yos = Math.round(this.yos);
		if (rect) {
			if (img === NNM.game.assets.images.sp_holox) {
				cx.filter = 'invert(1)';
				cx.drawImage(game.assets.images.vfx_explosion, 0, 0, 18, 18, 1, yos + 1, 18, 18);
				cx.filter = 'none';
			}
			cx.drawImage(img, rect[0], rect[1], rect[2], rect[3], 10 - (rect[2] >> 1), yos + 10 - (rect[3] >> 1), rect[2], rect[3]);
			if (rect[2] > 24 && scout.sender.slot !== scout.receiver.slot)
				cx.drawImage(game.assets.images.NNM_Archipelago_logo, 2, yos + 2);
		} else {
			cx.drawImage(img, 10 - (img.width >> 1), yos + 10 - (img.height >> 1));
		}
		cx.restore();
	}
}

export class BossDrop extends APPickup {
	#yVel = 0;
	duringCutscene = false;

	constructor(pos) {
		super(pos, (4 << 16) | archipelagoState.arenaId);
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
	canPickUp = false;

	constructor(cage, loc) {
		super(cage.pos.plus({x: -2, y: -6}), loc, true);
		this.#cage = cage;
	}

	move() {
		if (this.#cage.health)
			this.yos = 0;
		else {
			if (!this.canPickUp) this.frameCount = 0;
			this.canPickUp = true;
			this.pos.y -= Math.max(0, this.#yVel);
			this.#yVel -= .05;
		}
	}
}
