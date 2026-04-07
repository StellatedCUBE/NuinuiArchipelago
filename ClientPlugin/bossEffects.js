import { APPickup } from "./pickup.js";

export class DynamicFloor extends Actor {
	#data;
	#event;

	constructor(event, data) {
		super(Vector2.zero, Vector2.zero);
		this.#event = event;
		this.#data = data.map(datum => ({ pos: datum.pos, size: new Vector2(datum.size, 1) }));
	}

	update = game => {
		if (this.#event.bossActor?.size.x === 16) {
			archipelagoState.arenaB = game.scene.currentSection.pos.y + game.scene.currentSection.size.y;
			for (const datum of this.#data)
				if (archipelagoState.arenaB > datum.pos.y && CollisionBox.intersectsInAxis(this.#event.bossActor, datum, 'x'))
					archipelagoState.arenaB = datum.pos.y;
		}
	}
}

export class SkullBanner extends Actor {
	invincibility = 0;
	#event;

	constructor(event) {
		super(new Vector2(20 * 8.5 * 16 + 8, -4 * 16), Vector2.zero);
		this.draw = new Function('game', 'cx', '{'+NNM.code.filesMatching('actor/casino/casino.js')[0].lines.filter(l => l.scope && l.scope.startsWith('CasinoBoss.draw')).map(l => l.code).join(''));
		this.#event = event;
	}

	update = _ => {
		this.invincibility = this.#event.bossActor?.invincibility;
		this.toFilter = this.#event.bossActor?.canDie && !this.#event.bossActor.health && !(this.#event.bossActor instanceof Bibi);
		this.pos.y *= 0.9;
	}
}

export class CalliLand extends Actor {
	#calli;

	constructor(calli) {
		super(Vector2.zero, Vector2.zero);
		this.#calli = calli;
	}

	update = game => {
		if (this.toFilter = this.#calli.isGrounded) {
			this.#calli.vel = this.pos;
			this.#calli.setAnimation('hide');
			game.scene.actors = [this.#calli.scythe = new CalliScythe(this.#calli.pos.plus(new Vector2(this.#calli.size.x / 2 - 24, -12 * 16)), this.#calli), ...game.scene.actors];
		}
	}
}

export class SmokeCloud extends Actor {
	#life;

	constructor(pos, duration) {
		super(pos, Vector2.zero);
		this.#life = duration;
	}

	checkHit = _ => false;

	update = game => {
		for (let t = random() * 0.2; t < 6.3; t += random() * 0.2 + 0.1)
			game.scene.particles.smoke_black({x: this.pos.x, y: this.pos.y}, new Vector2(Math.sin(t), 0.1 + Math.cos(t)).times(random() + 0.33), 1);
		for (let t = random() * 0.2; t < 6.3; t += random() * 0.2 + 0.1)
			game.scene.particles.smoke_black({x: this.pos.x + Math.sin(t) * 12, y: this.pos.y + Math.cos(t) * 12}, new Vector2(Math.sin(t), 0.3 + Math.cos(t)).times(random() + 0.66), 1);
		for (let t = random() * 0.2; t < 6.3; t += random() * 0.2 + 0.1)
			game.scene.particles.smoke_black({x: this.pos.x + Math.sin(t) * 24, y: this.pos.y + Math.cos(t) * 24}, new Vector2(Math.sin(t), 0.3 +Math.cos(t)).times(random() + 1), 1);
		this.toFilter = !--this.#life;
	}
}

export class Darkness extends Actor {
	#event;
	#savedBossText;
	#savedBossIcon;

	constructor(event) {
		super(Vector2.zero, Vector2.zero);
		this.#event = event;
	}

	draw = game => {
		if (!this.#savedBossText && game.scene.bossText && game.scene.boss) {
			this.#savedBossText = game.scene.bossText;
			this.#savedBossIcon = game.scene.boss.icon;
			game.scene.bossText = null;
			game.scene.boss.icon = 1;
		}

		if (game.scene.boss?.canDie) {
			game.canvas1.style.filter = 'none';
			const boss = game.scene.boss;
			this.draw = game => {
				if (!boss.health) {
					this.toFilter = true;
					game.canvas1.style.filter = 'none';
				} else if (!game.nightMode && (boss instanceof Koyodrill ? boss.suddenDeathMode : boss.health <= boss.maxHealth / 2)) {
					game.playSound('noise');
					game.scene.shakeBuffer = 8;
					game.canvas1.style.filter = 'brightness(0%)';
					game.nightMode = true;
				}
			};
			if (this.#savedBossText && this.#savedBossText.textElems.en.chars[0] !== '?') {
				game.scene.bossText = this.#savedBossText;
				game.scene.boss.icon = this.#savedBossIcon;
			}
		}
	}
}

class BoatColReset extends Actor {
	#col;

	constructor(col) {
		super(Vector2.zero, Vector2.zero);
		this.#col = col;
	}

	update = _ => this.#col.pos.y = this.#col.next.pos.y = 999
}

export class SinkingBoat extends Actor {
	#event;
	#cocoY = 129;
	#timer = 0;

	#customDraw = game => {
		const cx = game.ctx0;
		cx.save();
		cx.translate(128, 0|this.#cocoY);

		for (let i in '...') {
			cx.drawImage(game.assets.images.sp_demon_spine, i * 24, 24, 24, 24, 32 - 12, 60 + i * 24 + 2 * Math.sin(2 * ((this.#timer + i * 120) % 360) * (Math.PI / 180)), 24, 24);
		}

		cx.drawImage(game.assets.images.sp_demon_head, 0, 96, 96, 96, -28, -20, 96, 96);

		cx.restore();
	}

	constructor(event) {
		super(Vector2.zero, Vector2.zero);
		this.#event = event;
	}

	update = game => {
		const SINK_SPEED = .7;
		if (this.#event.boat && this.#event.boat.pos.x > (0|(192 - (208 / 8)))) {
			this.#event.boat.pos.y += SINK_SPEED;
			for (const cannon of game.scene.actors.filter(a => a instanceof Cannon)) {
				cannon.pos.y += SINK_SPEED;
				if (cannon.pos.y + cannon.size.y > archipelagoState.arenaB) {
					cannon.health = 0;
					cannon.takeHit(game, cannon);
				}
			}
			this.#cocoY -= .5;
			let i = 0;
			while (!(''+game.scene.customDraw[i]).includes('sp_boat')) i++;
			game.scene.customDraw.splice(i, 0, this.#customDraw);
			game.scene.shakeBuffer = 2;
			if (!(this.#timer % 60)) {
				game.playSound('charge2');
			}
			this.#timer++;
			game.scene.warning = true;
			game.stopBGM();

			if (this.#event.boat.pos.y < archipelagoState.arenaB - 72 && !(this.#timer % 10)) {
				game.scene.particles.explosion(new Vector2(324 + ((20 * random()) << 4), archipelagoState.arenaB - 8), 0);
			}
			
			if (this.#event.boat.pos.x >= 192) {
				this.#event.bossActor = new Dragon(new Vector2(game.scene.view.pos.x + 128, this.#cocoY), 32);
				this.#event.bossActor.__archipelagoLaserBottom = archipelagoState.arenaB;
				this.#event.bossActor.phase = 'intro';
				this.#event.bossActor.frameCount = this.#timer;
				this.#event.timeline[2](game, {});
				this.#event.index = 4;
				this.#event.timelineFrame = 208;
				game.scene.actors = [this.#event.bossActor, ...game.scene.actors];

				this.update = _ => {
					for (const a of game.scene.actors) {
						if (this.#event.enemies.includes(a)) {
							a.pos.x += a.scrollSpeed;
							a.toFilter = a.scrollFilter && a.pos.x >= 41 * 16;
						}

						if (a instanceof Heart)
							a.pos.x++;
					}

					if (game.scene.boss?.canDie && !(this.#event.timelineFrame % 240) && random() > .75) {
						this.#event.addEnemy(Rock, new Vector2(10, (0 | random() * 3) / 2 + 9), 2, 0, 0, random() > 0.5);
					}
				}
			}
		}
	}
}

export class Boat extends Actor {
	#event;
	#yOffset;
	#previousArenaB = 0;

	#customDraw = game => {
		if (game.scene.bossKillEffect) {
			this.toFilter = true;
		} else {
			game.ctx0.drawImage(game.assets.images.sp_boat, Math.round(this.#event.boat.pos.x) - game.scene.view.pos.x, Math.round(this.#event.boat.pos.y) + this.#yOffset);
		}
	}

	constructor(event) {
		super(Vector2.zero, Vector2.zero);
		this.#event = event;

		if (archipelagoState.bossId === 'Demon Lord Miko') {
			this.draw = (game, cx) => {
				if (!event.bossActor && event.boat) {
					cx.drawImage(game.assets.images.sp_miko_sit, Math.round(event.boat.pos.x) + 180, this.#yOffset + 106);
					for (let _ in '..') game.scene.particles.smoke_pink(new Vector2(random() * 16 + 192 + event.boat.pos.x, random() * 20 + (96 + 20) + this.#yOffset), new Vector2(random() - .5, random() * -2), 0);
				}
			};
		}
	}

	update = game => {
		this.#yOffset = Math.round(Math.cos(Math.floor(this.#event.timelineFrame / 16) * (180 / Math.PI)));

		if (this.#event.index) {
			for (const a of game.scene.actors) {
				if (this.#event.enemies.includes(a)) {
					if (a instanceof Cannon) a.scrollSpeed = this.#event.boat.scrollSpeed;
					a.pos.x += a.scrollSpeed;
					a.toFilter = a.scrollFilter && a.pos.x >= 41 * 16;
					if (!a.shakeBuffer && a.waterEffect && !(a.frameCount % 6)) game.scene.particles.water_trail(a);
				}

				if (a instanceof Heart)
					a.pos.x++;
			}

			if (this.#event.boat) {
				game.scene.customDraw.push(this.#customDraw);
			}

			if (game.scene.boss?.canDie && !(this.#event.timelineFrame % 240) && random() > .75) {
				this.#event.addEnemy(Rock, new Vector2(10, (0 | random() * 3) / 2 + 9), 2, 0, 0, random() > 0.5);
			}

			if (this.#event.bossActor instanceof Suisei) {
				if (!this.col.pos.y) {
					game.scene.actors.splice(game.scene.actors.indexOf(this.#event.bossActor) + 1, 0, new BoatColReset(this.col));
				}
				const targetArenaB = this.#yOffset + 137;
				const delta = targetArenaB - this.#previousArenaB;
				this.col.pos.y = archipelagoState.arenaB = this.#previousArenaB = targetArenaB;
				if (this.#event.bossActor.phase === 'intro')
					this.col.next.pos.y = archipelagoState.arenaB = targetArenaB - 8;

				if (this.#event.bossActor.isGrounded || this.#event.bossActor.axe.isGrounded) {
					this.#event.bossActor.pos.y += delta;
					this.#event.bossActor.axe.pos.y += delta;
				}
			}

			else if (this.#event.bossActor instanceof EvilMiko && this.#event.bossActor.phase === 'sit') {
				this.#event.bossActor.pos = this.#event.boat.pos.plus({ x: 192, y: this.#yOffset + 110 });
			}
		}
	}
}

/*
export class FreeOnKill extends Actor {
	constructor(bgm) {
		super(Vector2.zero, Vector2.zero);
		this.bgm = bgm;
	}

	update = game => game.scene.bossKillEffect && game.scene.bossKillEffect < 4 && (this.toFilter = NNM.getPlayer().playerControl = true) && this.bgm && game.playBGM(this.bgm);
}
*/

export class Throne extends Actor {
	constructor(pos) {
		super(pos, Vector2.zero);
		this.isPersistent = NNM.game.currentStage !== 'holo_hq';
	}

	update = game => {
		if (!archipelagoState.arenaId && !game.scene.foreground['82_5'])
			this.toFilter = true;
		else if (!game.scene.bossKillEffect) game.scene.customDraw.push(game => {
			game.ctx0.save();
			game.ctx0.translate(-game.scene.view.pos.x, -game.scene.view.pos.y);
			game.ctx0.drawImage(game.assets.images.sp_throne, this.pos.x, this.pos.y);
			game.ctx0.restore();
		});
	}
}

export class ScrollManager extends Actor {
	constructor(boss) {
		super(Vector2.zero, Vector2.zero);
		this.boss = boss;
	}

	update = game => {
		if (game.scene.towerScroll === 2 && this.boss.health < this.boss.maxHealth / 2 && this.boss.canDie) {
			game.scene.towerScroll = 1;
			game.scene.shakeBuffer = 4;
			game.playSound('rumble');
		}
	}
}

const blackFrame = NUINUI_CASTLE_EVENTS['1_1'][1].timeline[0];
export class TurretManager extends Actor {
	#event;
	#blackHold;
	#targetPos;
	hands = []
	archipelago = true

	constructor(event) {
		super(NNM.game.scene.currentSection.pos.value(), NNM.game.scene.currentSection.size.value());
		this.#event = event;
		this.#blackHold = event.timeline.indexOf(blackFrame);
	}

	checkHit = _ => null

	update = game => {
		if (this.#event.index < this.#blackHold + !this.#event.timelineFrame)
			game.scene.customDraw.push(game => game.ctx2.fillStyle = '#000' && game.ctx2.fillRect(0, 0, game.width, game.height));
		if (!this.#event.bossActor)
			return;
		if (!this.#targetPos)
			this.#targetPos = new Vector2((game.width - this.#event.bossActor.size.x >> 1) + this.pos.x, 130);
		else if (!this.#event.bossActor.health && this.#event.bossActor.canDie) {
			game.scene.actors = game.scene.actors.filter(a => a !== this.#event.bossActor);
			this.#event.bossActor.isGrounded = false;
			this.#event.bossActor.defeatedPhase && this.#event.bossActor.defeatedPhase(game);
			this.draw = this.#event.bossActor.draw.bind(this.#event.bossActor);
			this.update = game => {
				const d = this.#event.bossActor.pos.distance(this.#targetPos);
				this.#event.bossActor.pos = this.#event.bossActor.pos.lerp(this.#targetPos, d > 72 ? 7.2 / d : 0.1);
				this.pos.y = this.#event.bossActor.pos.y - (game.height - this.#event.bossActor.size.y) / 2;
			};
		} /*else if (this.#event.bossActor.pos.y > 22 * 16 && this.#event.bossActor.pos.y < 1e5 && !(this.#event.bossActor instanceof Ina) && !(this.#event.bossActor instanceof Kanata)) {
			this.#event.bossActor.pos = new Vector2(this.#targetPos.x, this.pos.y - this.#event.bossActor.size.y);
		}*/
	}
}

export class FadeIn extends Actor {
	a = 1;

	#customDraw = game => {
		const cx = game.ctx2;
		cx.save();
		cx.fillStyle = '#FFF';
		cx.globalAlpha = this.a;
		cx.fillRect(0, 0, game.width, game.height);
		cx.restore();
	}

	constructor() {
		super(Vector2.zero, Vector2.zero);
	}

	update = game => {
		this.a -= 1/60;
		if (!(this.toFilter = this.a < 0.01))
			game.scene.customDraw.push(this.#customDraw);
	}
}

export class KiaraFire extends Actor {
	#customDraw = game => {
		const cx = game.ctx1;
		cx.save();
		cx.translate(archipelagoState.arenaL - game.scene.view.pos.x, 0);
		for (let y = 0; y < 6; y++)
			cx.drawImage(game.assets.images.sp_kiara_fire, (Math.floor(this.frameCount * .25) % 4) * 24, 0, 24, 32, 16 * Math.sin(this.frameCount) - 12, y * 32, 24, 32);
		cx.translate(archipelagoState.arenaR - archipelagoState.arenaL, 0);
		for (let y = 0; y < 6; y++)
			cx.drawImage(game.assets.images.sp_kiara_fire, (Math.floor(this.frameCount * .25) % 4) * 24, 0, 24, 32, -16 * Math.sin(this.frameCount) - 12, y * 32, 24, 32);
		cx.restore();
	}

	constructor() {
		super(Vector2.zero, Vector2.zero);
		//this.burn = event.bossActor instanceof Kiara ? (() => event.bossActor.blazeMode && event.bossActor.health) : (() => boss.canDie && boss.health < boss.maxHealth / 2);
	}

	update = game => {
		this.frameCount++;
		if (game.scene.boss?.canDie && game.scene.boss.health < game.scene.boss.maxHealth / 2) {
			const player = NNM.getPlayer();
			if (player.pos.x < archipelagoState.arenaL + 24 || player.pos.x > archipelagoState.arenaR - 24) {
				player.takeHit(game, player);
			}
			game.scene.customDraw.push(this.#customDraw);
		}
	}
}

export class Spikes extends Actor {
	constructor() {
		super(Vector2.zero, Vector2.zero);
	}

	update = game => {
		const flare = NNM.getPlayer();
		if (flare.pos.y <= 12 * 16 && flare.vel.y > 0) flare.vel.y = 0;
		if (flare.isGrounded && (flare.pos.x < 2.5 * 16 || flare.pos.x > 16.5 * 16)) {
			flare.takeHit(game, flare);
		}
	}
}

export class Bridge extends Actor {
	scroll = 0;
	scrollSpeed = 2;
	segments = [];
	archipelagoInaBridge = true;

	constructor(game) {
		super(Vector2.zero, Vector2.zero);
		this.l = game.scene.view.pos.x;
		game.scene.currentSection.collisions = game.scene.currentSection.collisions.filter(c => c.pos.y != archipelagoState.arenaB);
		for (let i = 0; i < 23; i++) {
			const segment = { pos: new Vector2(this.l + i * 16 - 16, archipelagoState.arenaB), size: new Vector2(16, 16), archipelagoInaBridge: true };
			this.segments.push(segment);
			if (i < 22)
				game.scene.currentSection.collisions.push(segment);
		}
	}

	destroy(game, box, ignoreY, mute) {
		if (ignoreY || (box.pos.y < archipelagoState.arenaB + 8 && box.pos.y + box.size.y > archipelagoState.arenaB)) {
			const startPixel = box.pos.x - this.l + this.scroll + 16;
			const startTile = startPixel >> 4;
			const endTile = Math.min((startPixel + box.size.x) >> 4, 21);
			let flag = !mute;
			for (let i = startTile; i <= endTile; i++) {
				if (this.segments[i].pos.y) {
					this.segments[i].pos.y = 0;
					game.scene.particles.explosion(new Vector2(this.l - this.scroll + i * 16 + 8, archipelagoState.arenaB), 0);
					if (flag) {
						flag = false;
						game.playSound('explosion');
					}
				}
			}
		}
	}

	#customDraw = game => {
		const cx = game.ctx1;
		const ts = game.assets.images.ts_holo_hq;
		cx.save();
		cx.translate(-16, archipelagoState.arenaB - game.scene.view.pos.y);
		for (let i = 1; i < 22; i++) {
			if (this.segments[i].pos.y) {
				cx.drawImage(ts, 32, 80, 16, 16, i * 16 - this.scroll, -16, 16, 16);
				if (this.segments[i + 1].pos.y) {
					if (this.segments[i - 1].pos.y)
						cx.drawImage(ts, 16, 80, 16, 16, i * 16 - this.scroll, 0, 16, 16);
					else
						cx.drawImage(ts, 0, 64, 16, 16, i * 16 - this.scroll, 0, 16, 16);
				} else {
					cx.drawImage(ts, 0, 80, 16, 16, i * 16 - this.scroll, 0, 16, 16);
				}
			}
		}
		cx.restore();
	}

	update = game => {
		game.scene.customDraw.push(this.#customDraw);
		this.frameCount++;
		if (!(this.frameCount % 600) && game.scene.boss && game.scene.boss.health < game.scene.boss.maxHealth * .75) {
			this.scrollSpeed = this.scrollSpeed === 2 ? (random() > .5 ? 1 : Infinity) : 2;
			game.playSound('charge2');
			if (game.config.getItem('screenShake')) {
				game.scene.shakeBuffer = 15;
				game.scene.thunder = 30;
			}
		}

		if (!game.scene.rain) {
			for (const segment of this.segments)
				segment.pos.y = archipelagoState.arenaB;
		} else if (!(this.frameCount % this.scrollSpeed) && game.scene.boss?.health && game.scene.boss.canDie && !game.scene.warning) {
			for (const segment of this.segments)
				segment.pos.x--;
			if (16 === ++this.scroll) {
				this.scroll = 0;
				const seg0 = this.segments[0];
				seg0.pos.x = this.l + 20 * 16;
				seg0.pos.y = archipelagoState.arenaB;
				for (let i = 0; i < 21; i++) 
					this.segments[i] = this.segments[i+1];
				this.segments[21] = seg0;
			}

			for (const actor of game.scene.actors) {
				if (actor !== this && !(
					actor instanceof APPickup ||
					actor instanceof PekoMiniBoss ||
					(actor instanceof Gura && actor.pos.y + actor.size.y < archipelagoState.arenaB) ||
					actor instanceof EvilMiko ||
					actor instanceof Block ||
					actor instanceof Kanata ||
					actor instanceof CalliScythe ||
					(actor instanceof Calli && ['attack', 'attack3'].includes(actor.phase)) ||
					actor instanceof LuiBird ||
					actor instanceof Card ||
					(actor instanceof Polka && ['c', 'fly'].includes(actor.phase)) ||
					actor instanceof Dragon ||
					actor instanceof DragonHand ||
					actor instanceof Laplus ||
					actor instanceof Koyodrill ||
					actor instanceof KoyodrillBody
				)) {
					actor.pos.x--;
					if (!(actor instanceof BibiFire) && CollisionBox.intersectCollisions(actor, game.scene.currentSection.collisions).length)
						actor.pos.x++;
				}
			}

			for (const particle of game.scene.particles.pool)
				particle.pos.x--;
		}

		const player = NNM.getPlayer();
		if (player.pos.y > game.scene.view.pos.y + game.scene.view.size.y) {
			for (let i = 0; i < 10; i++) {
				const target = this.segments[11 + i].pos.y ? this.segments[11 + i] : this.segments[11 - i];
				if (target.pos.y && !CollisionBox.intersectCollisions({ pos: { x: target.pos.x, y: archipelagoState.arenaB - 96 }, size: player.size }, game.scene.currentSection.collisions).length) {
					archipelagoState.deathCause = ' fell off';
					player.takeHit(game, player);
					player.pos = new Vector2(target.pos.x, archipelagoState.arenaB - 96);
					player.vel.x = 0;
					break;
				}
			}
		}
	}
}

export class AmeSpiral extends Actor {
	a = 1;
	rot = 0;
	isPersistent = true;

	constructor() {
		super(Vector2.zero, Vector2.zero);
	}

	#customDraw = game => {
		const cx = game.ctx0;
		cx.save();
		cx.globalAlpha = this.a;
		cx.translate(game.width * .5, game.height * .5);
		cx.rotate(this.rot);
		cx.drawImage(game.assets.images.sp_ame_spiral, 0, 0, 320, 320, -187, -187, 374, 374);
		cx.restore();
	}

	update = game => {
		this.a -= 1/300;
		this.rot -= 0.06283;
		if (!(this.toFilter = this.a < 1/300))
			game.scene.customDraw.push(this.#customDraw);
	}
}

function TowaOpen_customDraw(game) {
	const cx = game.ctx0;
	cx.fillStyle = '#000';
	cx.fillRect(0, 0, game.width, Math.round(game.scene.towaOffset));
	cx.fillRect(0, game.height, game.width, -Math.round(game.scene.towaOffset));
}

export class TowaOpen extends Actor {
	#section;
	isPersistent = true;

	constructor() {
		super(Vector2.zero, Vector2.zero);
		const scene = NNM.game.scene;
		this.#section = scene.currentSection;
		scene.towaOffset = 96;
		scene.customDraw.push(TowaOpen_customDraw);
		if (archipelagoState.arenaId === 19)
			for (let x = 161; x < 180; x++)
				for (let y = 72; y < 83; y++)
					if (scene.background[x+'_'+y] == 1)
						scene.background[x+'_'+y] = 'f';
	}

	update = game => {
		if (this.#section !== game.scene.currentSection) {
			game.scene.towaOffset = 0;
			this.toFilter = true;
			return;
		}
		game.scene.customDraw.push(TowaOpen_customDraw);
		if (game.scene.boss instanceof Towa) {
			if (game.scene.towaOffset) {
				game.scene.towaOffset -= .25;
				if (!(this.frameCount++ % 60)) {
					game.playSound('rumble');
					game.scene.shakeBuffer = 45;
				}
			} else {
				game.scene.boss.phase = 'idle';
				this.toFilter = NNM.getPlayer().playerControl = true;
				game.playBGM('towa');
			}
		}
	}
}

export class FadeReveal extends Actor {
	#event;
	#smoke_pink;

	constructor(event) {
		super(new Vector2(1856, 464), new Vector2(48, 48));
		this.#event = event;
		this.#smoke_pink = NNM.game.scene.particles.smoke_pink;
		NNM.game.scene.particles.smoke_pink = _ => {};
	}

	update = game => {
		if (!this.#event) {
			if (++this.frameCount === 120)
				game.scene.particles.smoke_pink = this.#smoke_pink;
		}
		else if (this.#event.bossActor) {
			if (CollisionBox.intersects(this, this.#event.bossActor)) {
				const oldDraw = this.#event.bossActor.draw;
				this.#event.bossActor.draw = (game, cx) => {
					if (archipelagoState.bossId === 'Demon Lord Miko' && this.frameCount < 600) {
						cx.filter = `brightness(${Math.floor(Math.min(this.frameCount, 600 - this.frameCount, 120) / (120 / 4)) / 8})`;
						cx.drawImage(game.assets.images.sp_cage, archipelagoState.bossSpawnX - 4, 500);
					}
					cx.filter = this.frameCount < 120 ? `brightness(${Math.floor(this.frameCount / (120 / 4)) / 4})` : 'none';
					oldDraw(game, cx);
				}
			}
			this.#event = null;
			this.pos.x = 0;
		}
	}
}

function BridgeLip_customDraw(game) {
	game.ctx1.drawImage(game.assets.images.ts_holo_hq, 0, 64, 16, 16, 160, 160, 16, 16);
}

export class BridgeLip extends Actor {
	constructor() {
		super(Vector2.zero, Vector2.zero);
	}

	update = game => {
		game.scene.customDraw.push(BridgeLip_customDraw);
		this.toFilter = game.scene.bossKillEffect;
		const player = NNM.getPlayer();
		if (player.pos.y > 768 + 192 - 32) {
			player.pos.x = 1920 + 160 + 32;
			player.pos.y = 768 + 192/2 - 16;
			player.takeHit(game, player);
		}
	}
}

export class RandomFubukiArenaManager extends Actor {
	constructor() {
		super(Vector2.zero, Vector2.zero);
		for (const actor of NNM.game.scene.actors) {
			if (actor instanceof IceBloc) {
				/*const col = { pos: actor.pos.value(), size: actor.size, archipelagoIce: true };
				NNM.game.scene.currentSection.collisions.push(col);
				const oldUpdate = actor.update;
				actor.update = game => {
					oldUpdate(game);
					if (actor.isWeak) col.pos.y = -20;
				};*/
				NNM.game.scene.currentSection.collisions.push(actor);
			}
		}
	}

	update = game => NNM.getPlayer().pos.y > game.scene.currentSection.pos.y + game.scene.currentSection.size.y && NNM.getPlayer().die(game, archipelagoState.deathCause = ' fell off')
}

let chloeFunc;
{
	let code = ''+NUINUI_CASINO_EVENTS['4_0'][0].timeline.find(frame => (''+frame).includes('class Card'));
	code = code.replace('flare.damage = 2;', 'const oldDamage = flare.damage; flare.damage = event.chloe.damage;').replace('flare.damage = 1;', 'flare.damage = oldDamage;').replace('event.chloe.draw();', '');
	chloeFunc = Function('return ' + code)();
}

export class Chloe extends Actor {
	#dir;
	#vDir;
	#table;
	#walkTo;
	offset = 0;
	icon = 13;
	health = 0;
	maxHealth = 32;

	constructor() {
		super(new Vector2(archipelagoState.arenaId === 2 ? archipelagoState.bossSpawnX - 24 : (archipelagoState.arenaL + archipelagoState.arenaR) / 2 - 32, archipelagoState.arenaB - 16), Vector2.zero);
		this.#dir = this.#vDir = NNM.getPlayer().pos.x > this.pos.x;
		this.damage = (NNM.game.currentQuest === 'nuinui') + 1;
		this.#walkTo = archipelagoState.arenaId === 18 ? -archipelagoState.arenaWalkTo : this.#dir ? this.pos.x + 80 : this.pos.x - 32;
		if (!NNM.getPlayer().playerControl)
			archipelagoState.arenaWalkTo = (this.#dir ? -1 : 1) * this.#walkTo;
		this.#table = new Actor(this.pos, new Vector2(64, 16));
		this.#table.update = _ => this.#vDir = NNM.getPlayer().pos.x + 8 > this.pos.x;
		this.#table.draw = (this.#table.isCollision = archipelagoState.arenaId !== 18) ? (game, cx) => {
			const ts = game.assets.images[game.scene.isAltColor ? 'ts_casino_alt' : 'ts_casino'];
			cx.translate(this.#table.pos.x, this.#table.pos.y);
			cx.drawImage(ts, 112, 48, 16, 16, 0, -16, 16, 16);
			cx.drawImage(ts, 112, 48, 16, 16, 48, -16, 16, 16);
			cx.drawImage(ts, 0, 80, 32, 16, 0, 0, 32, 16);
			cx.drawImage(ts, 16, 80, 32, 16, 32, 0, 32, 16);
			cx.drawImage(game.assets.images.sp_chloe, 10, 48, 18, 8, 32 - 9, -8, 18, 8);
		} : (game, cx) => {
			const ts = game.assets.images[game.scene.isAltColor ? 'ts_casino_alt' : 'ts_casino'];
			cx.translate(this.#table.pos.x, this.#table.pos.y);
			cx.drawImage(ts, 112, 48, 16, 16, 3, 1, 16, 16);
			cx.drawImage(ts, 112, 48, 16, 16, 45, 1, 16, 16);
			cx.drawImage(game.assets.images.sp_chloe, 10, 48, 18, 8, 32 - 9, 8, 18, 8);
		};
		this.#table.checkHit = _ => null;
		NNM.game.scene.actors.push(this.#table);
		this.pos = archipelagoState.arenaId === 18 ? new Vector2(2612, 112) : this.pos.plus({ x: this.#dir ? -16 : 80, y: -32 });
		NNM.game.scene.events.push(new GameEvent([game => {
			if (game.scene.actors.at(-1) !== this.#table) {
				const index = game.scene.actors.indexOf(this.#table);
				if (index >= 0) {
					game.scene.actors[index] = game.scene.actors.at(-1);
					game.scene.actors[game.scene.actors.length - 1] = this.#table;
				}
			}
		}]));
	}

	draw = (game, cx) => {
		cx.translate(this.pos.x, this.pos.y);
		if (this.#vDir) cx.scale(-1, 1);
		if (this.stunBuffer) cx.drawImage(game.assets.images.vfx_stun, Math.floor(this.frameCount / 8) % 4 * 24, 0, 24, 12, -12, 0, 24, 12);
		cx.drawImage(game.assets.images.sp_chloe, this.offset * 48, 0, 48, 48, -24, 1, 48, 48);
		if (this.stunBuffer > 30 && this.offset) cx.drawImage(game.assets.images.sp_chloe, 0, 48, 9, 3, -4, 22, 9, 3);
	}

	event(game, event) {
		const player = NNM.getPlayer();
		if (!event.timelineFrame && archipelagoState.arenaId === 19)
			player.playerControl = true;
		if (player.playerControl) {
			let popup = 0;
			if (player.isGrounded && (this.#dir ? !player.dir && player.pos.x >= this.#table.pos.x + 64 && player.pos.x < this.#table.pos.x + 80 : player.dir && player.pos.x > this.#table.pos.x - 32 && player.pos.x <= this.#table.pos.x - 16)) {
				if (game.keys.up) {
					player.playerControl = false;
					player.vel.x = 0;
					event.upBuffer = true;
					if (archipelagoState.bgmId !== 'play_dice')
						game.stopBGM();
				} else popup = 32;
			}
			const bubblePos = player.pos.plus({ x: 8, y: -24 });
			instantBubble(game, this, 'bubble', bubblePos, popup, game.assets.locales[game.lang]['challenge'], { speed: 0, growDir: new Vector2(-1, -1), closeBtn: true, closeBtnType: 'up' });
			if (this.bubble) {
				this.bubble.pos = bubblePos.plus({ x: this.bubble.size.x / -2, y: 0});
				if (!popup) this.bubble.close();
			}
		} else if (Math.abs(player.pos.x - this.#walkTo) > 20) {
			//NNM.game.cpuKeys[this.#dir ? 'left' : 'right'] = true;
			player.playerControl = true;
		} else {
			game.resetCpuKeys();
			if (!game.scene.boss) {
				event.timelineFrame = 0;
				game.playSound('question');
				game.scene.boss = event.chloe = this;
				game.scene.bossText = new LocaleElem(game, 'sakamata_chloe');
				game.scene.lockedViewPos = new Vector2(this.#table.pos.x - 8 * 16, game.scene.view.pos.y);
			}
			chloeFunc(game, event);
			if (event.next) {
				game.scene.boss = game.scene.bossText = game.scene.lockedViewPos = null;
				if (game.currentStage !== 'casino')
					game.stopBGM();
				if (archipelagoState.arenaId !== 18)
					archipelagoState.item(this.pos.plus({ x: -10, y: -8 }), 'boss');
			} else if (!game.bgm && this.health >= this.maxHealth) {
				game.playBGM('play_dice');
			}
		}

	}
}

export class BossCamera extends Actor {
	constructor(boss, y) {
		super(Vector2.zero, Vector2.zero);
		this.boss = boss;
		this.y = y;
		if (!(this.toFilter = boss instanceof Chloe))
			this.update(NNM.game);
	}

	update = game => {
		if (game.scene.boss)
			this.boss = game.scene.boss;
		if (this.boss instanceof Calli && !this.boss.scythe)
			return;
		if (!game.scene.lockedViewPos)
			game.scene.lockedViewPos = new Vector2(0, this.y);
		if (this.boss.canDie && !this.boss.health)
			this.toFilter = !(game.scene.lockedViewPos = null);
		else
			game.scene.lockedViewPos.x = Math.min(Math.max((this.boss.pos.x + NNM.getPlayer().pos.x - game.width) >> 1, game.scene.currentSection.pos.x), game.scene.currentSection.pos.x + game.scene.currentSection.size.x - game.width);
	}
}
