import { APPickup } from "./pickup.js";

export class SkullBanner extends Actor {
	invincibility = 0;

	constructor(event) {
		super(new Vector2(20 * 8.5 * 16 + 8, -4 * 16), Vector2.zero);
		this.draw = new Function('game', 'cx', '{'+NNM.code.filesMatching('actor/casino/casino.js')[0].lines.filter(l => l.scope && l.scope.startsWith('CasinoBoss.draw')).map(l => l.code).join(''));
		this.event = event;
	}

	update = _ => {
		this.invincibility = this.event.bossActor?.invincibility;
		this.toFilter = this.event.bossActor?.canDie && !this.event.bossActor.health && !(this.event.bossActor instanceof Bibi);
		this.pos.y *= 0.9;
	}
}

export class SmokeCloud extends Actor {
	constructor(pos, duration) {
		super(pos, Vector2.zero);
		this.life = duration;
	}

	checkHit = _ => false;

	update = game => {
		for (let t = Math.random() * 0.2; t < 6.3; t += Math.random() * 0.2 + 0.1)
			game.scene.particles.smoke_black({x: this.pos.x, y: this.pos.y}, new Vector2(Math.sin(t), 0.1 + Math.cos(t)).times(Math.random() + 0.33), 1);
		for (let t = Math.random() * 0.2; t < 6.3; t += Math.random() * 0.2 + 0.1)
			game.scene.particles.smoke_black({x: this.pos.x + Math.sin(t) * 12, y: this.pos.y + Math.cos(t) * 12}, new Vector2(Math.sin(t), 0.3 + Math.cos(t)).times(Math.random() + 0.66), 1);
		for (let t = Math.random() * 0.2; t < 6.3; t += Math.random() * 0.2 + 0.1)
			game.scene.particles.smoke_black({x: this.pos.x + Math.sin(t) * 24, y: this.pos.y + Math.cos(t) * 24}, new Vector2(Math.sin(t), 0.3 +Math.cos(t)).times(Math.random() + 1), 1);
		this.toFilter = !--this.life;
	}
}

export class Darkness extends Actor {
	constructor(event) {
		super(Vector2.zero, Vector2.zero);
		this.event = event;
	}

	draw = game => {
		if (!this.savedBossText && game.scene.bossText && game.scene.boss) {
			this.savedBossText = game.scene.bossText;
			this.savedBossIcon = game.scene.boss.icon;
			game.scene.bossText = null;
			game.scene.boss.icon = 1;
		}

		if (this.event.bossActor?.canDie) {
			game.canvas1.style.filter = 'none';
			this.draw = game => {
				if (!this.event.bossActor.health) {
					this.toFilter = true;
					game.canvas1.style.filter = 'none';
				} else if (!game.nightMode && this.event.bossActor.health <= this.event.bossActor.maxHealth / 2) {
					game.playSound('noise');
					game.scene.shakeBuffer = 8;
					game.canvas1.style.filter = 'brightness(0%)';
					game.nightMode = true;
				}
			};
			if (this.savedBossText && this.savedBossText.textElems.en.chars[0] !== '?') {
				game.scene.bossText = this.savedBossText;
				game.scene.boss.icon = this.savedBossIcon;
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
				game.scene.particles.explosion(new Vector2(324 + ((20 * Math.random()) << 4), archipelagoState.arenaB - 8), 0);
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

					if (game.scene.boss?.canDie && !(this.#event.timelineFrame % 240) && Math.random() > .75) {
						this.#event.addEnemy(Rock, new Vector2(10, (0 | Math.random() * 3) / 2 + 9), 2, 0, 0, Math.random() > 0.5);
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
					for (let _ in '..') game.scene.particles.smoke_pink(new Vector2(Math.random() * 16 + 192 + event.boat.pos.x, Math.random() * 20 + (96 + 20) + this.#yOffset), new Vector2(Math.random() - .5, Math.random() * -2), 0);
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

			if (game.scene.boss?.canDie && !(this.#event.timelineFrame % 240) && Math.random() > .75) {
				this.#event.addEnemy(Rock, new Vector2(10, (0 | Math.random() * 3) / 2 + 9), 2, 0, 0, Math.random() > 0.5);
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

export class BossCamera extends Actor {
	constructor(boss, y) {
		super(Vector2.zero, Vector2.zero);
		this.boss = boss;
		this.y = y;
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

export class Throne extends Actor {
	isPersistent = true;

	constructor(pos) {
		super(pos, Vector2.zero);
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
	hands = []
	archipelago = true

	constructor(event) {
		super(NNM.game.scene.currentSection.pos.value(), NNM.game.scene.currentSection.size.value());
		this.event = event;
		this.blackHold = event.timeline.indexOf(blackFrame);
	}

	checkHit = _ => null

	update = game => {
		if (this.event.index < this.blackHold + !this.event.timelineFrame)
			game.scene.customDraw.push(game => game.ctx2.fillStyle = '#000' && game.ctx2.fillRect(0, 0, game.width, game.height));
		if (!this.event.bossActor)
			return;
		if (!this.targetPos)
			this.targetPos = new Vector2((game.width - this.event.bossActor.size.x >> 1) + this.pos.x, 130);
		else if (!this.event.bossActor.health && this.event.bossActor.canDie) {
			game.scene.actors = game.scene.actors.filter(a => a !== this.event.bossActor);
			this.event.bossActor.isGrounded = false;
			this.event.bossActor.defeatedPhase && this.event.bossActor.defeatedPhase(game);
			this.draw = this.event.bossActor.draw.bind(this.event.bossActor);
			this.update = game => {
				const d = this.event.bossActor.pos.distance(this.targetPos);
				this.event.bossActor.pos = this.event.bossActor.pos.lerp(this.targetPos, d > 72 ? 7.2 / d : 0.1);
				this.pos.y = this.event.bossActor.pos.y - (game.height - this.event.bossActor.size.y) / 2;
			};
		} else if (this.event.bossActor.pos.y > 22 * 16 && this.event.bossActor.pos.y < 1e5 && !(this.event.bossActor instanceof Ina) && !(this.event.bossActor instanceof Kanata)) {
			this.event.bossActor.pos = new Vector2(this.targetPos.x, this.pos.y - this.event.bossActor.size.y);
		}
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
		const ts = game.assets.images[`ts_${game.scene.tilesetId}${game.scene.isAltColor ? '_alt' : ''}`];
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
			this.scrollSpeed = this.scrollSpeed === 2 ? (Math.random() > .5 ? 1 : Infinity) : 2;
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
					actor instanceof DragonHand
				)) {
					actor.pos.x--;
					if (CollisionBox.intersectCollisions(actor, game.scene.currentSection.collisions).length)
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
	constructor() {
		super(Vector2.zero, Vector2.zero);
		NNM.game.scene.towaOffset = 96;
		NNM.game.scene.customDraw.push(TowaOpen_customDraw);
		if (archipelagoState.arenaId === 19)
			for (let x = 161; x < 180; x++)
				for (let y = 72; y < 83; y++)
					if (NNM.game.scene.background[x+'_'+y] == 1)
						NNM.game.scene.background[x+'_'+y] = 'f';
	}

	update = game => {
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
