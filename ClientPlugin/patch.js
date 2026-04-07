export const NAME = 'Archipelago';

NNM.code.insertAtStartOfScope('SaveData.setItem', 'if (self.archipelagoState) return;');
NNM.code.insertAtEndOfScope('Scene.drawPlayerHealth', 'if (self.archipelagoState?.reconnecting) cx.drawImage(game.assets.images.NNM_Archipelago_dc, 5, 5);');
NNM.code.insertAfterFirstMatchingLine('TextElem.constructor', 'this.lang =', function() {
	if (self.archipelagoState && this.lang === "en" && chars.some(c => !FONT_EN[c])) {
		chars = this.chars = [
			...chars.join('')
			.toLowerCase()
			.normalize('NFKD')
			.replace(/\p{Diacritic}/gu, '')
			.replace(/ß/g, 'ss')
			.replace(/ø/g, 'o')
			.replace(/ł/g, 'l')
		].map(c => FONT_EN[c] ? c : "?");
	}
});
NNM.code.insertAtStartOfScope('TextBubble.parse_en', 'char = char.toLowerCase(); if (!FONT_EN[char] && char !== "\\n") char = "?";');
NNM.code.insertBeforeFirstMatchingLine('KeyboardListener.handler', 'preventDefault', 'if (document.activeElement.tagName === "INPUT") return;');
NNM.code.insertAtStartOfScope('Game.update', 'self.archipelagoState?.update();');
NNM.code.insertBeforeFirstMatchingLine('StageSelect.constructor', 'this.cursorPos', 'if (self.archipelagoState) this.stageIndex = Math.max(0, this.stages.map(s => s.stageId).indexOf(game.currentStage));');
NNM.code.insertAfterFirstMatchingLine('StageSelect.update', 'this.stageIndex = ', 'if (self.archipelagoState) this.stageIndex = Math.max(0, this.stages.map(s => s.stageId).indexOf(this.nextStage));');
NNM.code.insertAtStartOfScope('Game.playBGM', 'if (self.archipelagoState) id = self.archipelagoState.getBgm(id);');
NNM.code.insertAtEndOfScope('Game.setQuest', function() {
	if (self.archipelagoState) {
		this.saveData.data = {};
		Object.assign(this.saveData.data, self.archipelagoState.saves[this.currentQuest]);
	}
});
NNM.code.insertBeforeFirstMatchingLine('NewGameMenuEvent.constructor', 'initFunc(', _ => {
	if (self.archipelagoState) {
		self.archipelagoState.oldSave = game.saveData.data;
		game.saveData.data = {};
	}
});
NNM.code.insertAfterFirstMatchingLine('NewGameMenuEvent.constructor', 'initFunc(', _ => {
	if (self.archipelagoState) {
		game.saveData.data = self.archipelagoState.oldSave;
	}
});
NNM.code.insertBeforeFirstMatchingLine('Item.options', 'setQuest', 'self.archipelagoState?.disconnect()');
NNM.code.insertBeforeFirstMatchingLine('Item.constructor', 'achievementCount', function() {
	if (self.archipelagoState) {
		this.options = this.options.filter(o => o.id !== 'achievements' && o.id !== 'save' && o.id !== 'load');
		if (Object.values(self.archipelagoState.availableLevels).filter(x => x.size).length > 1) {
			for (let i = 0; i < this.options.length; i++) {
				if (this.options[i].id === 'stage_select') {
					this.options.splice(i + 1, 0, {
						id: 'archipelago_quest_select',
						func: _ => self.archipelagoState.selectQuest(this)
					});
					break;
				}
			}
		}
		for (let i = 0; i < this.options.length; i++) {
			if (this.options[i].id === 'return_to_title') {
				this.options.splice(i, 0, {
					id: 'archipelago_console',
					func: _ => self.archipelagoState.console(this)
				});
				break;
			}
		}
	}
});
NNM.code.insertBeforeFirstMatchingLine('PopUpMenu.drawOptions', "'stage'", function() {
	if (this.type === 'archipelago') {
		const [i, r] = this.typeId;
		if (r)
			cx.drawImage(i, r[0], r[1], r[2], r[3], 0|(r[2] * -0.5), 0|(24 - r[3] * 0.5), r[2], r[3]);
		else
			cx.drawImage(i, 0|(i.width * -0.5), 0|(24 - i.height * 0.5));
	}
});

function itemTextParticle(a, loc, side) {
	const scout = archipelagoState.scouts[loc];
	if (scout) {
		let name = scout.name;
		if (scout.receiver.game === 'Hollow Knight')
			name = name.replace(/_/g, ' ');
		const text = scout.receiver.slot === scout.sender.slot ? [name] : [name, 'for ' + scout.receiver.name];
		if (!side) side = a.pos.y < NNM.game.scene.currentSection.pos.y + 32 ? 'bottom' : 'top';
		if (side === 'left' || side === 'right') {
			archipelagoState.textParticle(
				side === 'left' ? a.pos.x - 8 : a.pos.x + a.size.x + 8,
				a.pos.y + a.size.y / 2,
				text,
				side === 'left' ? 'right' : 'left',
				-0.12
			);
		} else {
			archipelagoState.textParticle(
				a.pos.x + a.size.x / 2,
				side === 'top' ? a.pos.y - 8 : a.pos.y + a.size.y + 8,
				text,
				'center',
				side === 'top' ? -0.12 : 0.12
			);
		}
	}
}

export function enemySanity(a, loc) {
	if (archipelagoState.checkAvailable(loc)) {
		const oldTakeHit = a.takeHit;
		a.takeHit = (game, x) => {
			const extant = game.scene.actors.includes(a);
			oldTakeHit(game, x);
			if (extant && !game.scene.actors.includes(a)) {
				archipelagoState.check(loc, true);
				if (a instanceof CrystalSource) {
					itemTextParticle(a, loc, a.dir && 'bottom');
					for (const a2 of game.scene.actors)
						if (a2 instanceof Crystal && !a2.frameCount)
							a2.toFilter = true;
				} else if (a instanceof Cannon) {
					itemTextParticle(a, loc, a.dir ? 'right' : 'left');
				} else if (!(a instanceof Box && a.type === 'cage')) {
					itemTextParticle(a, loc);
				}
			}
		};
		if (a instanceof CrystalSource) {
			const oldDraw = a.draw;
			a.draw = (game, cx) => {
				oldDraw(game, cx);
				cx.save();
				cx.translate(Math.round(a.pos.x), Math.round(a.pos.y + 8));
				if (a.dir) cx.scale(1, -1);
				cx.drawImage(game.assets.images.NNM_Archipelago_sheen, 1, -6);
				cx.restore();
			};
		} else if (a instanceof Box) {
			if (a.type === 'box') {
				const oldDraw = a.draw;
				a.draw = (game, cx) => {
					oldDraw(game, cx);
					cx.drawImage(game.assets.images.NNM_Archipelago_crate, Math.round(a.pos.x) + 4, Math.round(a.pos.y) + 3);
				};
			}
		} else {
			const oldUpdate = a.update;
			a.update = game => {
				oldUpdate(game);
				if (~-a.frameCount & 15) return;
				const clr = (random() * 6) << 3;
				const t = random() * 6.28;
				const s = random() * 0.4 + 0.8;
				game.scene.particles.pool.push(new Particle({
					zIndex: 0,
					lifespan: 40 + (0|(random() * 16)),
					pos: new Vector2(a.pos.x + (1 + s * Math.sin(t)) * a.size.x * 0.5, a.pos.y + (1 + s * Math.cos(t)) * a.size.y * 0.5),
					vel: new Vector2(Math.sin(t) * 0.2, random() * 0.15 - 0.3),
					draw: function(cx, assets) {
						cx.drawImage(assets.images.NNM_Archipelago_circles, (this.life * 4 / this.lifespan) << 3, clr, 8, 8, Math.round(this.pos.x) - 4, Math.round(this.pos.y) - 4, 8, 8);
					}
				}));
			};
		}
	}
}
NNM.code.insertAfterFirstMatchingLine('Scene.updateSection', 'this.actors.push', function() {
	if (self.archipelagoState) {
		const loc = (
			Object.keys(game.quests.nuinui.stages).indexOf(game.currentStage) |
			(this.sections.indexOf(newSection) << 3) |
			(newSection.actors.indexOf(event) << 9) |
			({nuinui: 10, random: 13, maiden: 14}[game.currentQuest] << 16)
		);
		self.archipelagoState.scout(loc);
		enemySanity(this.actors[this.actors.length - 1], loc);
	}
}, {enemySanity});
NNM.code.insertAfterFirstMatchingLine('NUINUI_PORT_EVENTS', 'else enemy = new enemyClass', _ => {
	if (self.archipelagoState && !(enemy instanceof Rock)) {
		event.archipelagoEnemySanityCheck = event.archipelagoEnemySanityCheck ? event.archipelagoEnemySanityCheck + 1 : (11 << 16);
		enemySanity(enemy, event.archipelagoEnemySanityCheck);
	}
}, {enemySanity});
NNM.code.insertAtStartOfScope('Game.setStage', function() {
	if (self.archipelagoState) {
		self.archipelagoState.actorsToAdd = [];
		if (this.currentQuest === 'maiden') {
			self.archipelagoState.levelEndCheckA = self.archipelagoState.levelEndCheckB = 0;
		} else {
			const stageIndex = Object.keys(this.quests.nuinui.stages).indexOf(stageId);
			if (this.currentQuest === 'nuinui') {
				self.archipelagoState.scout(10 + stageIndex);
				self.archipelagoState.scout(30 + stageIndex);
				if (stageId === 'casino')
					self.archipelagoState.scout(1);
				else if (stageId === 'port')
					self.archipelagoState.scout(5);
				else if (stageId === 'yamato') {
					self.archipelagoState.scout(2);
					self.archipelagoState.scout(6);
				} else if (stageId === 'heaven')
					self.archipelagoState.scout(7);
				else if (stageId === 'holo_hq')
					for (let i = (5 << 16) + 1; i < (5 << 16) + 6; i++)
						self.archipelagoState.scout(i);
				if (self.archipelagoState.onlyNoel)
					this.mode = 'noel';
			} else {
				if (stageId === 'casino')
					for (let i in '......')
						self.archipelagoState.scout((8 << 16) | i);
				for (let i in '....')
					self.archipelagoState.scout((6 << 16) | (stageIndex << 2) | i);
			}

			self.archipelagoState.scout(self.archipelagoState.levelEndCheckA = ((1 + (this.currentQuest === 'random')) << 16) | stageIndex);
			self.archipelagoState.scout(self.archipelagoState.levelEndCheckB = (3 << 16) | stageIndex);
		}
	}
});
NNM.code.insertAtEndOfScope('StageSelect.confirm', 'if (self.archipelagoState && this.nextStage === "falls") game.scene.setFromMenu = true;');
NNM.code.insertAtEndOfScope('Scene.constructor', 'self.archipelagoState?.onSceneStart(this);');
NNM.code.insertAfterFirstMatchingLine('Checkpoint.update', 'this.canHelp = true', 'if (self.archipelagoState && !flare.helpHealth) this.canHelp = self.archipelagoState.helpsAvailable;');
NNM.code.insertAtStartOfScope('instantBubble', 'if (self.archipelagoState && bubbleId === "helpBubble") text += ` (${self.archipelagoState.helpsAvailable})`;');
NNM.code.insertAfterFirstMatchingLine('Checkpoint.update', 'helpHealth = ', 'self.archipelagoState?.spendHelp();');
NNM.code.insertBeforeFirstMatchingLine('NUINUI_HOLO_HQ_EVENTS', 'sp_okayu', 'if (!event.__archipelagoNoMogu)');
NNM.code.insertBeforeFirstMatchingLine('NUINUI_HOLO_HQ_EVENTS', '.pos.x -= 20 * 16', 'if (self.archipelagoState && flare.helpPosAnim) flare.helpPosAnim.x -= 20 * 16;');
NNM.code.insertAfterFirstMatchingLine('NUINUI_HOLO_HQ_EVENTS', 'koroneDir', _ => {
	if (self.archipelagoState && !event.timelineFrame) {
		const cp = new Checkpoint({pos:Vector2.zero});
		cp.pos = okayuPos.plus({x: -8, y: 24});
		cp.draw = cp.setCheckpoint = _ => {};
		const oldUpdate = cp.update;
		cp.update = game => {
			const particles = game.scene.particles.pool.length;
			oldUpdate(game);
			if (NNM.getPlayer().helpHealth)
				event.__archipelagoNoMogu = true;
			else
				game.scene.particles.pool.length = particles;
		};
		game.scene.actors.push(cp);
	}
});
NNM.code.insertAfterFirstMatchingLine('Aircon.update', 'actors.forEach', 'if (self.archipelagoState && !actor.vel) return;');
NNM.code.insertAfterFirstMatchingLine('MovingBlock.update', 'actors.forEach', 'if (self.archipelagoState && actor instanceof Kanata) return;');
NNM.code.findReplaceAllLines('NUINUI_CASINO_EVENTS', "'casino_6'", "game.mode==='noel'?'archipelago_noel_greeting':'casino_6'");
NNM.code.findReplaceAllLines('NUINUI_CASINO_EVENTS', "game.assets.locales[game.lang]['casino_8']", "self.archipelagoState?.giftText(1)||game.assets.locales[game.lang]['casino_8']");
NNM.code.insertBeforeAllMatchingLines('NUINUI_CASINO_EVENTS', 'play_dice', 'if (self.archipelagoState?.bossId !== "Chloe")');
NNM.code.insertBeforeFirstMatchingLine('NUINUI_PORT_EVENTS', 'flare.die', 'if (self.archipelagoState) self.archipelagoState.deathCause = " lost a duel to Lui";');
NNM.code.findReplaceAllLines('NUINUI_YAMATO_EVENTS', "'yamato_0'", "game.mode==='noel'?'archipelago_noel_greeting':'yamato_0'");
NNM.code.findReplaceAllLines('NUINUI_YAMATO_EVENTS', "game.assets.locales[game.lang]['yamato_2']", "self.archipelagoState?.giftText(2)||game.assets.locales[game.lang]['yamato_2']");
NNM.code.insertBeforeFirstMatchingLine('NUINUI_YAMATO_EVENTS', 'flare.die', 'if (self.archipelagoState) self.archipelagoState.deathCause = " lost a duel to Iroha";');
NNM.code.insertAfterFirstMatchingLine('NUINUI_CASTLE_EVENTS', 'flare.pos.y > scene.lockedViewPos.y + game.height', 'if (self.archipelagoState) self.archipelagoState.deathCause = " didn\'t climb fast enough";');
NNM.code.insertAtStartOfScope('Flare.die', 'self.archipelagoState?.death();');
for (const character of ['Flare', 'Noel', 'MarinePlayer', 'PekoraPlayer']) {
	NNM.code.insertAtStartOfScope(character + '.takeHit', 'if (self.archipelagoState) self.archipelagoState.hitBy = other;');
	if (character !== 'PekoraPlayer') NNM.code.findReplaceAllLines(character, 'Miteiru,', 'Miteiru, ...(self.archipelagoState ? [Koyodrill, KoyodrillBody] : []),');
}
NNM.code.insertAtEndOfScope('VaporBlock.constructor', 'this.vaporCollisionBox.__archipelagoVapor = true;');
NNM.code.insertAtStartOfScope('IntroEvent.endIntro', 'if (self.archipelagoState) self.archipelagoState.incomingDeath = false;');
NNM.code.findReplaceAllLines('Torche.update', ' instanceof Noel', ' instanceof Noel && !self.archipelagoState');
NNM.code.findReplaceAllLines('NUINUI_PORT_EVENTS', "game.mode !== 'noel'", "(game.mode !== 'noel' || self.archipelagoState)");
NNM.code.insertBeforeFirstMatchingLine('Aqua.takeHit', "'dual'", 'if (self.archipelagoState) self.archipelagoState.item(this.pos.value(), 5); else');
NNM.code.insertAfterFirstMatchingLine('NUINUI_FALLS_EVENTS', 'actor !== event.boss', 'if (self.archipelagoState?.slotData.boss.nnq[0] === "Usadrill") self.archipelagoState.item(event.boss.middleParts[8].pos.value(), "boss");');
NNM.code.insertAfterFirstMatchingLine('NUINUI_FALLS_EVENTS', 'RocketPickup', 'if (self.archipelagoState?.slotData.boss.nnq[1] === "Pekora") self.archipelagoState.item(event.pekora.pos.value(), "boss");');
NNM.code.findReplaceAllLines('PekoraBoss.update', 'if (CollisionBox.intersectCollisions', 'if (!this.__archipelagoNoCollide&&CollisionBox.intersectCollisions');
NNM.code.findReplaceAllLines('PekoraBoss.update', "game.mode === 'marine'", "(self.archipelagoState ? this.maxHealth > 40 : game.mode === 'marine')");
NNM.code.findReplaceAllLines('PekoMiniBoss.draw', 'part.pos.y > game.height', '(part.pos.y > game.height && !self.archipelagoState)');
NNM.code.findReplaceAllLines('PekoMiniBoss', 'size.y < 0', 'size.y < (self.archipelagoState?.arenaT ?? 0)');
NNM.code.findReplaceAllLines('PekoMiniBoss.update', '9 * 16', '(self.archipelagoState ? self.archipelagoState.arenaT + 144 : 9 * 16)');
NNM.code.findReplaceAllLines('PekoMiniBoss.introPhase', '24', '(self.archipelagoState?.arenaT ?? 0) + 24');
NNM.code.findReplaceAllLines('PekoMiniBoss.resurfacePhase', '24', '(self.archipelagoState?.arenaT ?? 0) + 24');
NNM.code.insertAtStartOfScope('PekoMiniBoss.drillReleasePhase', 'if (self.archipelagoState) { this.drillReleaseExplosion = true; game.scene.actors.find(a => a.archipelagoInaBridge)?.destroy(game, this.middleParts.at(-1)); }');
NNM.code.findReplaceAllLines('PekoMiniBoss.drillReleasePhase', '8 * 16', '(self.archipelagoState?.arenaT ?? 0) + 8 * 16');
NNM.code.findReplaceAllLines('PekoMiniBoss.drillChargePhase', '18', '18 + (self.archipelagoState?.arenaT ?? 0)');
NNM.code.findReplaceAllLines('PekoMiniBoss.idlePhase', '6 * 16', '(self.archipelagoState?.arenaT ?? 0) + 6 * 16');
NNM.code.insertAtStartOfScope('PekoMiniBoss.introPhase', function() {
	const bridge = game.scene.actors.find(a => a.archipelagoInaBridge);
	if (bridge) {
		bridge.destroy(game, this.leftParts[0]);
		bridge.destroy(game, this.rightParts[0]);
	}
});
NNM.code.findReplaceAllLines('Calli.update', "game.currentStage === 'casino'", "(game.currentStage === 'casino' || (self.archipelagoState && this.skullBoss))");
NNM.code.findReplaceAllLines('Calli.update', 'game.scene.currentSection.collisions', '__archipelago_col');
NNM.code.insertAtStartOfScope('Calli.update', `
	let __archipelago_col = game.scene.currentSection.collisions;
	if (this.isGrounded) this.archipelagoIgnoreEventCollisions = null;
	if (this.archipelagoIgnoreEventCollisions?.collision) __archipelago_col = __archipelago_col.filter(c => c !== this.archipelagoIgnoreEventCollisions.collision);
	else if (this.archipelagoIgnoreEventCollisions?.collisions) __archipelago_col = __archipelago_col.filter(c => !this.archipelagoIgnoreEventCollisions.collisions.includes(c));
`);
for (const scope of ['Miko.chantPhase', 'EvilFlare.attackPhase']) {
	NNM.code.insertAfterFirstMatchingLine(scope, '-', _ => {
		if (self.archipelagoState) {
			for (let i = 2; i > 0; i--) {
				const a = game.scene.actors[game.scene.actors.length - i];
				a.toFilter = a.pos.x < self.archipelagoState.arenaTL || a.pos.x + a.size.x > self.archipelagoState.arenaTR;
			}
		}
	});
}
NNM.code.insertBeforeFirstMatchingLine('Miko.idlePhase', 'this.maxHealth / 2', 'if (!self.archipelagoState)');
NNM.code.findReplaceAllLines('Marine.update', '6 * 16', '(self.archipelagoState && self.archipelagoState.arenaId !== 4 ? self.archipelagoState.arenaB - 40 : 6 * 16)');
NNM.code.findReplaceAllLines('Marine.idlePhase', '30 * 16', '(self.archipelagoState ? (self.archipelagoState.arenaL + self.archipelagoState.arenaR) / 2 : 30 * 16)');
NNM.code.insertAfterFirstMatchingLine('Marine.movePhase', 'new DokuroEnemy', 'if (self.archipelagoState && self.archipelagoState.arenaId !== 4)' +
	'game.scene.actors.at(-1).pos = new Vector2((self.archipelagoState.arenaL + self.archipelagoState.arenaR) / 2 - 8, self.archipelagoState.arenaB - 48);');
NNM.code.insertAtStartOfScope('Marine.movePhase', 'if (self.archipelagoState) this.__archipelago_t += this.moveDir/53;')
NNM.code.insertAtStartOfScope('Marine.dashPhase', 'if (self.archipelagoState) this.__archipelago_t += this.moveDir/26;')
NNM.code.insertBeforeFirstMatchingLine('Marine.update', 'this.pos.x = ', 'if (this.__archipelago_xl && this.phase !== "defeated") this.pos.x = lerp(this.__archipelago_xl, this.__archipelago_xr, this.__archipelago_t); else');
NNM.code.insertAfterFirstMatchingLine('NUINUI_YAMATO_EVENTS', '!event.fubuzilla.health', 'if (event.fubuzilla.canDie < 2 && self.archipelagoState) self.archipelagoState.item(new Vector2(718, 1050), "boss");');
NNM.code.insertAfterFirstMatchingLine('Ayame.focusPhase', 'this.vel = ', 'if (self.archipelagoState?.arenaId === 1) this.vel.y *= 0.73;');
NNM.code.insertAfterFirstMatchingLine('Ayame.update', 'const newCollisionBox', 'if (self.archipelagoState) newCollisionBox.pos.y = Math.round(this.pos.y);');
NNM.code.insertBeforeFirstMatchingLine('Fubuki.update', "game.currentQuest === 'random'", 'if (self.archipelagoState) {if (this.pos.x < self.archipelagoState.arenaL || this.pos.x > self.archipelagoState.arenaR - 16) {this.vel.x *= -1; this.moveDir *= -1;}} else');
NNM.code.insertBeforeFirstMatchingLine('Flare.deathTransition', 'deathTransitionIndex === 360', 'if (self.archipelagoState && this.deathTransitionIndex===360) self.archipelagoState.diedToNoel(); else');
NNM.code.findReplaceAllLines('Suisei.introPhase', 'scenePos.y + 6 * 16', '(self.archipelagoState ? self.archipelagoState.arenaB - 64 : scenePos.y + 6 * 16)');
NNM.code.findReplaceAllLines('Axe.update', 'game.scene.currentSection.pos', 'self.archipelagoState ? {x:Math.min(self.archipelagoState.arenaL,self.archipelagoState.arenaTL)-32,y:self.archipelagoState.arenaB-160} : game.scene.currentSection.pos');
NNM.code.findReplaceAllLines('Axe.update', 'scenePos.x + 14 * 16', '(self.archipelagoState ? Math.max(self.archipelagoState.arenaR, self.archipelagoState.arenaTR) - 64 : scenePos.x + 14 * 16)');
NNM.code.insertAtStartOfScope('Axe.update', function() {
	if ([4, 18].includes(self.archipelagoState?.arenaId)) {
		if (this.gravityBuffer === Infinity) {
			if (this.suisei.phase === 'charge') {
				this.gravityBuffer = 0;
			} else {
				this.pos.x -= Math.cos(this.angle) / 2;
				this.pos.y += Math.sin(this.angle) / 2;
			}
		} else if (this.gravityBuffer === 1) {
			this.gravityBuffer = Infinity;
		}
	}
});
NNM.code.insertBeforeFirstMatchingLine('Suisei.chargePhase', 'this.phaseBuffer === 300', 'if (self.archipelagoState?.arenaId === 18 && this.phaseBuffer < 300 && NNM.getPlayer().pos.y > this.pos.y) this.aimAngle += this.aimAngle ? .2 : -.2;');
NNM.code.findReplaceAllLines('Suisei.rainPhase', 'scenePos.x', '(self.archipelagoState ? this.pos.x - 152 : scenePos.x)');
NNM.code.findReplaceAllLines('Suisei.idlePhase', 'this.axe.isGrounded', '(this.axe.isGrounded || (self.archipelagoState && this.axe.gravityBuffer === Infinity))');
NNM.code.findReplaceAllLines('Suisei.idlePhase', 'CollisionBox.center(this).distance(CollisionBox.center(this.axe))', '(self.archipelagoState ? Math.abs(this.pos.x - this.axe.pos.x - 24) : CollisionBox.center(this).distance(CollisionBox.center(this.axe)))');
NNM.code.insertBeforeFirstMatchingLine('Suisei.idlePhase', 'new Comet', _ => {
	if (self.archipelagoState) {
		const l = Math.max(self.archipelagoState.arenaL + 32, self.archipelagoState.arenaTL);
		const r = Math.min(self.archipelagoState.arenaR - 48, self.archipelagoState.arenaTR);
		p1.x = l + ((random() * (r - l)) & ~15);
	}
});
NNM.code.findReplaceAllLines('Polka.update', '(6 * 20 + 13) * 16', '(self.archipelagoState ? self.archipelagoState.arenaL + 1 : (6 * 20 + 13) * 16)');
NNM.code.findReplaceAllLines('Polka.update', '(6 * 20 + 26) * 16', '(self.archipelagoState ? self.archipelagoState.arenaR - 17 : (6 * 20 + 26) * 16)');
NNM.code.findReplaceAllLines('Polka.update', 'new Vector2((133 + 4 * i) * 16, 37 * 16)',
	'self.archipelagoState && self.archipelagoState.arenaId !== 9 ? new Vector2(self.archipelagoState.arenaL + 32 + i * (self.archipelagoState.arenaR - self.archipelagoState.arenaL - 96) / 3, self.archipelagoState.arenaT) : new Vector2((133 + 4 * i) * 16, 37 * 16)');
NNM.code.findReplaceAllLines('Polka.update', 'new Vector2((133 + (i % 2 ? 12 : 0)) * 16, (38 + (i > 1 ? 5 : 0)) * 16)',
	'self.archipelagoState && self.archipelagoState.arenaId !== 9 ?' +
	'new Vector2(i % 2 ? self.archipelagoState.arenaL + 32 : self.archipelagoState.arenaR - 64, i > 1 ? self.archipelagoState.arenaB - 48 : self.archipelagoState.arenaT + 16) :' +
	'new Vector2((133 + (i % 2 ? 12 : 0)) * 16, (38 + (i > 1 ? 5 : 0)) * 16)'
);
for (const actor of ['Ayame', 'Demon', 'DemonHand', 'Dragon', 'DragonHand', 'Axe', 'Comet'])
	NNM.code.insertAtStartOfScope(actor + '.checkHit', 'if (self.archipelagoState && collisionBox instanceof Aircon) return;');
NNM.code.insertAfterFirstMatchingLine('NUINUI_CASTLE_EVENTS', 'new EvilMiko', 'self.archipelagoState?.scout(3);');
NNM.code.insertAfterFirstMatchingLine('NUINUI_CASTLE_EVENTS', 'mikoBossCleared = true', 'if (game.mode === "noel") self.archipelagoState?.item(event.miko.pos.value(), "boss");');
NNM.code.insertAfterFirstMatchingLine('NUINUI_CASTLE_EVENTS', "game.timer && game.mode !== 'noel'", 'self.archipelagoState?.check(3);');
NNM.code.insertAfterFirstMatchingLine('NUINUI_CASTLE_EVENTS', "'hint'", _ => {
	if (self.archipelagoState?.pendingPopUp) {
		game.menu = self.archipelagoState.pendingPopUp;
		self.archipelagoState.pendingPopUp = null;
	}
});
NNM.code.insertAfterFirstMatchingLine('EvilMiko.takeHit', 'dragonBreath = ', 'if (self.archipelagoState?.arenaId === 4) this.dragonBreath = 0;');
NNM.code.insertAfterFirstMatchingLine('EvilMiko.attackPhase', 'crystalDist = ', 'if (self.archipelagoState) this.crystalDist = Math.min(this.crystalDist, this.pos.x - self.archipelagoState.arenaL - 24, self.archipelagoState.arenaR - this.pos.x - 40);');
NNM.code.insertAfterFirstMatchingLine('EvilMiko.attack3Phase', 'this.bucketPos = ', 'if (self.archipelagoState?.arenaId === 23) this.bucketPos.x = Math.max(2671, Math.min(2769, this.bucketPos.x));');
NNM.code.findReplaceAllLines('EvilMiko.attack3Phase', '37 * 16', 'self.archipelagoState ? Math.max(self.archipelagoState.arenaB - 144, self.archipelagoState.arenaT + 16) : 37 * 16');
NNM.code.findReplaceAllLines('EvilMiko.attack3Phase', 'flare.pos.x', '(self.archipelagoState?.arenaId === 4 ? 374 : flare.pos.x)');
NNM.code.insertAfterFirstMatchingLine('EvilMiko.attack3Phase', 'const bullet =', 'bullet.__archipelagoLava = self.archipelagoState?.arenaId === 4;');
NNM.code.insertAfterFirstMatchingLine('Bullet.update', 'currentSection.collisions', function() {
	const spawnX = 354;
	if (this.__archipelagoLava && !game.scene.actors.some(a => a instanceof Rock && a.pos.x < spawnX + 44 && a.pos.x > spawnX - 44)) {
		game.scene.events.find(e => e.addEnemy).addEnemy(Rock, new Vector2(spawnX / 16, 9.75 + random() / 2), 2, 0, 0, random() > 0.5);
		game.playSound('NNM_Archipelago_cobblestone');
	}
});
NNM.code.findReplaceAllLines('EvilFlare.attackPhase', '24 * 16', 'self.archipelagoState ? game.scene.currentSection.pos.y : 24 * 16');
NNM.code.findReplaceAllLines('EvilFlare.jumpPhase', '32 * 16', '(self.archipelagoState ? self.archipelagoState.arenaB - 32 : 32 * 16)');
NNM.code.findReplaceAllLines('EvilFlare.update', '32 * 16', '(self.archipelagoState && self.archipelagoState.arenaId !== 11 ? (this.phase === "defeated") * 1e5 + self.archipelagoState.arenaB - 32 : 32 * 16)');
NNM.code.findReplaceAllLines('EvilFlare.update', '36 * 16', '(self.archipelagoState ? self.archipelagoState.arenaR - 16 : 36 * 16)');
NNM.code.findReplaceAllLines('EvilFlare.update', '23 * 16', 'self.archipelagoState?.arenaL ?? 23 * 16');
NNM.code.insertBeforeFirstMatchingLine('NUINUI_CASTLE_EVENTS', 'scene.particles.charge', "if (event.demon.archipelago) return event.timelineFrame % 60 || game.playSound('charge2');");
NNM.code.insertAfterFirstMatchingLine('NUINUI_CASTLE_EVENTS', 'event.timelineFrame > 8 * 60 && (game.keys.a || game.keys.start)', 'if (!self.archipelagoState)');
NNM.code.insertAfterFirstMatchingLine('NUINUI_CASTLE_EVENTS', "'stage'", _ => {
	if (self.archipelagoState) {
		if (self.archipelagoState.pendingPopUp) {
			game.menu = self.archipelagoState.pendingPopUp;
			self.archipelagoState.pendingPopUp = null;
		} else {
			game.menu = new Item(game);
		}
	}
});
NNM.code.insertAtStartOfScope('Demon.endPhase', 'if (self.archipelagoState && this.phaseBuffer === 180) this.hands[0].toFilter = this.hands[1].toFilter = this.toFilter = true;');
NNM.code.findReplaceAllLines('Demon.introPhase', '13.5 * 16', '(self.archipelagoState ? game.scene.view.pos.y + 24 : 13.5 * 16)')
NNM.code.findReplaceAllLines('Demon.endPhase', '28 * 16', '(self.archipelagoState ? game.scene.view.pos.x + 128 : 28 * 16)');
NNM.code.findReplaceAllLines('Demon.handPhase', '20 * 16', '(self.archipelagoState ? self.archipelagoState.arenaB - 32 : 20 * 16)');
NNM.code.findReplaceAllLines('ShirakenHelper.update', '20 * 16', '(self.archipelagoState ? self.archipelagoState.arenaB - 32 : 20 * 16)');
NNM.code.findReplaceAllLines('ShirakenHelper.update', '-1,', 'self.archipelagoState && this.dir ? 1 + (self.archipelagoState.arenaId === 18) : -1,');
NNM.code.findReplaceAllLines('Demon.laserPhase', '96', 'self.archipelagoState ? 999 : 96');
NNM.code.findReplaceAllLines('Demon.laserPhase', '22 * 16', 'this.__archipelagoLaserBottom ?? 22 * 16');
NNM.code.findReplaceAllLines('Demon', '33 * 16', 'self.archipelagoState ? game.scene.view.pos.x + 208 : 33 * 16');
NNM.code.findReplaceAllLines('Demon', '23 * 16', 'self.archipelagoState ? game.scene.view.pos.x + 48 : 23 * 16');
NNM.code.findReplaceAllLines('Demon.laserPhase', '28 * 16', 'self.archipelagoState ? game.scene.view.pos.x + 128 : 28 * 16');
NNM.code.insertAfterFirstMatchingLine('Demon.draw', 'sp_demon_laser', `
	if (self.archipelagoState && self.archipelagoState.arenaId !== 1) {
		cx.drawImage(game.assets.images.sp_demon_laser, (Math.floor(this.frameCount * .25) % 4) * 64, 149, 64, 43, 0, 160, 64, 86);
		cx.drawImage(game.assets.images.sp_demon_laser, (Math.floor(this.frameCount * .25) % 6) * 64, 0, 64, 96, 0, this.__archipelagoLaserBottom - Math.round(this.pos.y) - 96, 64, 96);
	} else
`);
NNM.code.insertBeforeFirstMatchingLine('NUINUI_HOLO_HQ_EVENTS', 'event.key = ', 'self.archipelagoState&&scene.bossOrder.sort((a,b)=>!game.saveData.getItem("key-"+a)-!game.saveData.getItem("key-"+b));');
NNM.code.findReplaceAllLines('Kiara.draw', '< 6;', '<(game.scene.currentSection.size.y>>5);');
NNM.code.insertAfterFirstMatchingLine('Gura.attackPhase', 'targetY = ', 'self.archipelagoState&&(this.targetY = self.archipelagoState.guraY);');
NNM.code.insertAfterFirstMatchingLine('Gura.attack2Phase', 'targetY = ', 'self.archipelagoState&&(this.targetY = self.archipelagoState.guraY + 32);');
NNM.code.insertAfterFirstMatchingLine('Gura.attack3Phase', 'targetY = ', 'self.archipelagoState&&(this.targetY = self.archipelagoState.guraY);');
NNM.code.insertAfterFirstMatchingLine('Gura.attack3Phase', 'explosion', 'game.scene.actors.find(a => a.archipelagoInaBridge)?.destroy(game, this, true, true);');
NNM.code.findReplaceAllLines('Gura.attack3Phase', 'scenePos.y + 8 * 16', '(self.archipelagoState?self.archipelagoState.arenaB-32:scenePos.y + 8 * 16)');
NNM.code.findReplaceAllLines('Gura.idlePhase', 'scenePos.y', '(self.archipelagoState?self.archipelagoState.guraY-16:scenePos.y)');
for (const scope of ['Gura.attackPhase', 'Gura.attack4Phase', 'Gura.movePhase']) {
	NNM.code.findReplaceAllLines(scope, 'const target', 'let target');
	NNM.code.insertAfterFirstMatchingLine(scope, 'let target', 'self.archipelagoState&&(target = this.targetSide ? self.archipelagoState.guraRight : self.archipelagoState.guraLeft);');
}
NNM.code.findReplaceAllLines('Gura.draw', '< 6;', '<(game.scene.currentSection.size.y>>5);');
NNM.code.findReplaceAllLines('Gura', 'game.scene.currentSection.pos', '(self.archipelagoState && game.scene.lockedViewPos || game.scene.currentSection.pos)');
NNM.code.findReplaceAllLines('Ina.attack3Phase', '13 * 16', '(self.archipelagoState ? self.archipelagoState.arenaT + 16 : 13 * 16)');
NNM.code.findReplaceAllLines('Ina.update', '&&', '&& (!self.archipelagoState || game.scene.rain) &&');
NNM.code.findReplaceAllLines('Ina.takeHit', '21.5 * 16', '(self.archipelagoState ? game.scene.currentSection.pos.y + game.scene.currentSection.size.y - 40 : 22.5 * 16)');
NNM.code.findReplaceAllLines('Ina.idlePhase', 'Math', '(self.archipelagoState ? game.scene.currentSection.pos.y + game.scene.currentSection.size.y - 384 : 0) + Math');
NNM.code.findReplaceAllLines('Tentacle.update', '22.5 * 16', '(self.archipelagoState ? game.scene.currentSection.pos.y + game.scene.currentSection.size.y - 24 : 22.5 * 16)');
NNM.code.insertAfterFirstMatchingLine('Tentacle.update', 'const x', 'if (!self.archipelagoState || game.scene.rain)');
NNM.code.insertBeforeFirstMatchingLine('Tentacle.update', 'water_trail', 'if (!self.archipelagoState || game.scene.rain)');
NNM.code.insertAfterFirstMatchingLine('Ame.clockPhase', 'flare.dir =', _ => {
	if (self.archipelagoState?.ameResetData) {
		const {pos, dir, fx} = self.archipelagoState.ameResetData;
		flare.pos = pos;
		flare.dir = dir;
		game.scene.actors.push(fx);
	}
});
NNM.code.insertAtStartOfScope('Scene.get collisions', 'const __archipelago_plr=NNM.getPlayer();')
NNM.code.findReplaceAllLines('Scene.get collisions', 'this.currentSection.collisions', '(self.archipelagoState?.arenaId === 16 && __archipelago_plr.pos.y + __archipelago_plr.size.y > self.archipelagoState.arenaB &&' +
	'__archipelago_plr.pos.y < self.archipelagoState.arenaB + 16 ? this.currentSection.collisions.map(c => !c.archipelagoInaBridge || c.pos.x + c.size.x <= __archipelago_plr.pos.x || c.pos.x >= __archipelago_plr.pos.x + __archipelago_plr.size.x ?' +
	'c : {pos:{x:__archipelago_plr.pos.x + __archipelago_plr.size.x,y:c.pos.y},size:c.size}) : this.currentSection.collisions)');
NNM.code.findReplaceAllLines('Kanata.divePhase', '-8 * 16', '(self.archipelagoState ? game.scene.currentSection.pos.y - 128 : -8 * 16)');
NNM.code.findReplaceAllLines('Kanata.divePhase', '12 * 16', '(self.archipelagoState ? game.scene.currentSection.pos.y + 192 : 12 * 16)');
NNM.code.findReplaceAllLines('Kanata.divePhase', /10 [*] 16/g, '(self.archipelagoState && self.archipelagoState.arenaId !== 18 && self.archipelagoState.arenaId !== 4 ? self.archipelagoState.arenaB - self.archipelagoState.arenaT : 10 * 16)');
NNM.code.insertAfterAllMatchingLines('Kanata', 'this.targetY = Math', 'if (self.archipelagoState) this.targetY += game.scene.currentSection.pos.y;');
NNM.code.findReplaceAllLines('Kanata', '8.5 * 20 * 16', '(self.archipelagoState ? (self.archipelagoState.arenaL + self.archipelagoState.arenaR) / 2 : 8.5 * 20 * 16)');
NNM.code.findReplaceAllLines('Kanata', '(8 * 20 + (this.targetSide ? 16 : 3)) * 16', '(self.archipelagoState ? (this.targetSide ? self.archipelagoState.arenaR - 64 : self.archipelagoState.arenaL + 48) : (8 * 20 + (this.targetSide ? 16 : 3)) * 16)');
NNM.code.insertAfterFirstMatchingLine('NUINUI_HEAVEN_EVENTS', 'unlockAchievement(27)', 'self.archipelagoState && !game.bgm && game.playBGM("kiseki");')
NNM.code.insertAtStartOfScope('Dragon.endPhase', 'if (self.archipelagoState && this.phaseBuffer === 180) this.hands[0].toFilter = this.hands[1].toFilter = this.toFilter = true;');
NNM.code.findReplaceAllLines('Dragon.introPhase', '(60 + 13.5) * 16', '(self.archipelagoState ? game.scene.view.pos.y + 24 : (60 + 13.5) * 16)')
NNM.code.findReplaceAllLines('Dragon.endPhase', '28 * 16', '(self.archipelagoState ? Infinity : 28 * 16)');
NNM.code.insertAfterFirstMatchingLine('Dragon.laserPhase', 'new Projectile', 'game.scene.actors.find(a => a.archipelagoInaBridge)?.destroy(game, game.scene.actors.at(-1));');
NNM.code.findReplaceAllLines('Dragon.laserPhase', '96', 'self.archipelagoState ? 999 : 96');
NNM.code.findReplaceAllLines('Dragon.laserPhase', '(12 * 6 + 10) * 16', 'this.__archipelagoLaserBottom ?? (12 * 6 + 10) * 16');
NNM.code.findReplaceAllLines('Dragon', '173 * 16', 'self.archipelagoState ? game.scene.view.pos.x + 208 : 173 * 16');
NNM.code.findReplaceAllLines('Dragon', '163 * 16', 'self.archipelagoState ? game.scene.view.pos.x + 48 : 163 * 16');
NNM.code.findReplaceAllLines('Dragon.laserPhase', '168 * 16', 'self.archipelagoState ? game.scene.view.pos.x + 128 : 168 * 16');
NNM.code.insertAfterFirstMatchingLine('Dragon.draw', 'sp_demon_laser', `
	if (self.archipelagoState && self.archipelagoState.arenaId !== 1) {
		cx.drawImage(game.assets.images.sp_demon_laser, (Math.floor(this.frameCount * .25) % 4) * 64, 341, 64, 43, 0, 160, 64, 86);
		cx.drawImage(game.assets.images.sp_demon_laser, (Math.floor(this.frameCount * .25) % 6) * 64, 192, 64, 96, 0, this.__archipelagoLaserBottom - Math.round(this.pos.y) - 96, 64, 96);
	} else
`);
NNM.code.findReplaceAllLines('Towa', '8 * 16', '(self.archipelagoState ? self.archipelagoState.arenaB - 32 : 8 * 16)');
NNM.code.findReplaceAllLines('Towa.bibiPhase', '9.5 * 16', '(self.archipelagoState ? (self.archipelagoState.arenaL + self.archipelagoState.arenaR) / 2 - 8 : 9.5 * 16)');
NNM.code.findReplaceAllLines('Towa.bibiPhase', '(2 + i * 5) * 16', '(self.archipelagoState ? (i + .5) * (self.archipelagoState.arenaR - self.archipelagoState.arenaL) / 4 - 8 + self.archipelagoState.arenaL : (2 + i * 5) * 16)');
NNM.code.insertAfterFirstMatchingLine('Towa.update', 'this.isCeilling = false', 'if (self.archipelagoState && this.isUpsideDown && this.health && this.vel.y === 0) this.vel.y = -16;');
NNM.code.insertBeforeFirstMatchingLine('Bibi.checkHit', 'return', 'if (self.archipelagoState && collision && collisionBox instanceof Aircon) this.phase = "idle";');
NNM.code.insertAtStartOfScope('Bibi.idlePhase', 'if (self.archipelagoState) { if (!this.isGrounded) return; this.vel.x = 0; }');
NNM.code.insertBeforeFirstMatchingLine('NUINUI_HOLO_HQ_EVENTS', 'bg_kiara', _ => {
	if (self.archipelagoState && game.scene.boss instanceof Towa) {
		const ys = game.scene.boss.mirrorAnim ? (game.scene.boss.mirrorAnim / 10 - 1) * (game.scene.boss.mirror ? 1 : -1) : game.scene.boss.mirror ? -1 : 1;
		if (ys !== 1) {
			cx.translate(0, game.height / 2);
			cx.scale(1, ys);
			cx.translate(0, -game.height / 2);
		}
	}
});
NNM.code.findReplaceAllLines('RobotBoss', 'PekoraPlayer', 'Flare');
NNM.code.findReplaceAllLines('RobotBoss.phases.move', 'possibleTargets = [', 'possibleTargets = (this.__archipelagoTargets||[');
NNM.code.findReplaceAllLines('RobotBoss.phases.move', '].filter', ']).filter');
NNM.code.findReplaceAllLines('Lui.constructor', 'random() * 3', '(self.archipelagoState && self.archipelagoState.arenaB < room.pos.y + 130 ? 0 : random() * 3)');
NNM.code.findReplaceAllLines('Iroha.constructor', '30 * 16', '(self.archipelagoState?.arenaB ?? 30 * 16)');
NNM.code.insertBeforeFirstMatchingLine('Laplus.tpPhase', 'this.tpPos = ', 'while (!this.tpPos || (self.archipelagoState && (game.scene.foreground[`${this.tpPos.x>>4}_${this.tpPos.y>>4}`] || game.scene.foreground[`${this.tpPos.x>>4}_${this.tpPos.y+16>>4}`])))');
NNM.code.insertAfterFirstMatchingLine('Laplus.tpPhase', 'this.pos = Vector2.zero', 'if (self.archipelagoState) this.pos.x = -99;');
NNM.code.insertAfterFirstMatchingLine('Laplus.laserPhase', 'new Projectile', 'game.scene.actors.find(a => a.archipelagoInaBridge)?.destroy(game, game.scene.actors.at(-1));');
NNM.code.findReplaceAllLines('Laplus.laserPhase', 'scenePos.y + 10 * 16', 'this.__archipelagoLaserBottom ?? scenePos.y + 10 * 16');
NNM.code.insertAfterFirstMatchingLine('Laplus.idlePhase', 'this.targetY = ', 'if (self.archipelagoState) this.targetY = lerp(self.archipelagoState.arenaT + 16, Math.min(self.archipelagoState.arenaB - 48, self.archipelagoState.arenaT + 80), random()) & ~15;');
NNM.code.insertAtStartOfScope('Laplus.update', 'if (self.archipelagoState && "number" === typeof this.targetY) this.targetY = Math.max(this.targetY, self.archipelagoState.arenaT);');
NNM.code.insertAfterFirstMatchingLine('Laplus.draw', 'sp_demon_laser', `
	if (self.archipelagoState && self.archipelagoState.arenaId !== 1) {
		cx.drawImage(game.assets.images.sp_demon_laser, (Math.floor(this.frameCount * .25) % 4) * 64, 149, 64, 43, -32, 112, 64, 86);
		cx.drawImage(game.assets.images.sp_demon_laser, (Math.floor(this.frameCount * .25) % 6) * 64, 0, 64, 96, -32, this.__archipelagoLaserBottom - Math.round(this.pos.y) - 112, 64, 96);
	} else
`);
NNM.code.insertAtEndOfScope('KoyodrillBody.takeHit', 'if (self.archipelagoState && game.currentQuest !== "random") this.dropHeart(game, .4);');

NNM.code.insertAfterFirstMatchingLine('BowPickup.update', 'CollisionBox.intersects', 'if (self.archipelagoState) self.archipelagoState.setSaveField("nuinui", "item-gun");');
for (const scope of NNM.code.filesMatching('bowPickup.js')[0].scopes)
	if (scope.endsWith('.constructor') && scope !== 'BowPickup.constructor')
		NNM.code.insertAtEndOfScope(scope, 'if (self.archipelagoState) this.toFilter = true;');
NNM.code.insertAfterFirstMatchingLine('Crystal.update', 'player.crystalCount = ', 'self.archipelagoState?.getCrystals(1);');
NNM.code.insertAtEndOfScope('ShopMenu.checkEnabled', 'if (self.archipelagoState) this.options = this.options.filter(o => o.id !== "menu_shop_bomb");');
NNM.code.insertAtStartOfScope('ShopMenu.checkEnabled', 'if(self.archipelagoState){for(const o of this.options)if(o.archipelago_location)o.enabled=!archipelagoState.checked(o.archipelago_location);this.options.push({id:"menu_shop_bomb"})}');
NNM.code.insertAtEndOfScope('ShopMenu.constructor', function() {
	if (self.archipelagoState)
	for (const option of this.options) {
		let scout = self.archipelagoState.scouts[option.archipelago_location];
		if (scout) {
			let name = scout.name;
			if ((option.local = scout.sender.slot === scout.receiver.slot) && name[0] === '(') {
				const [quest, stage] = name.split(') ');
				name = stage + ' in ' + quest.substr(1);
			} else if (scout.receiver.game === 'Hollow Knight')
				name = name.replace(/_/g, ' ');
			if (option.local && scout.id === (17 << 16)) {
				option.text = new LocaleElem(game, 'menu_shop_bomb', { textAlign: 'center' });
			} else if (option.local && game.assets.locales.en['archipelago_shop_' + scout.id]) {
				option.text = new TextElem(game, [...game.assets.locales.en['archipelago_shop_' + scout.id]], { lang: 'en', textAlign: 'center' });
			} else {
				let name_width = 0;
				for (const chr of name)
					name_width += FONT_EN[chr]?.width ?? 6;
				if (name_width < 57)
					option.text = new TextElem(game, [...name], { lang: 'en', textAlign: 'center' });
				else if (option.local)
					option.text = new LocaleElem(game, 'archipelago_shop_local', { textAlign: 'center' });
			}
			option.desc = new LocaleElem(
				game,
				!option.local ? `raw:sends ${name} to ${scout.receiver.name}` :
				scout.id === (17 << 16) ? 'archipelago_shop_bomb' :
				scout.id === (12 << 16) ? 'archipelago_shop_gsh' :
				scout.id === (10 << 16) ? 'archipelago_shop_coin' :
				scout.id === (15 << 16) ? 'archipelago_shop_prog_level_nnq' :
				scout.id === (15 << 16) + 1 ? 'archipelago_shop_prog_level_mmq' :
				([1,2,3,4].includes(scout.id >> 16) ? 'raw:unlocks ' : [5,8,16].includes(scout.id >> 16) ? 'raw: get the ' : 'raw:get ') + name,
				{ textAlign: 'center' }
			);
			if (scout.receiver.game === 'FLARE NUINUI QUEST')
				option.icon = self.archipelagoState.getIcon(scout.id);
		}
	}
});
NNM.code.insertAfterFirstMatchingLine('ShopMenu.constructor', 'super', function() {
	if (self.archipelagoState) {
		for (const o of this.options) {
			const f = o.func;
			o.func = (g,v) => {
				const p = NNM.getPlayer().crystalCount;
				f(g,v);
				if (NNM.getPlayer().crystalCount < p)
					self.archipelagoState.getCrystals(-o.price);
			};
		}

		for (const i in '...') {
			const negative_price = 50 * ~i, archipelago_location = i | (7 << 16);
			if (self.archipelagoState.client.room.allLocations.includes(archipelago_location))
			this.options.push({
				id: 'archipelago_shop',
				price: -negative_price,
				archipelago_location,
				func: game => {
					if (self.archipelagoState.checkAvailable(archipelago_location)) {
						self.archipelagoState.getCrystals(negative_price);
						self.archipelagoState.noPopup = true;
						self.archipelagoState.check(archipelago_location);
						self.archipelagoState.noPopup = false;
						game.playSound('cling2');
						this.checkEnabled(game);
					}
				}
			});
		}
	}
});
NNM.code.insertBeforeFirstMatchingLine('ShopMenu.drawOptions', 'const id ', _ => {
	if (self.archipelagoState && opt.archipelago_location) {
		if (!opt.local)
			cx.drawImage(game.assets.images.NNM_Archipelago_logo, -8, 14);
		if (opt.icon) {
			let [x, y, w, h] = opt.icon[1] || [0, 0, opt.icon[0].width, opt.icon[0].height];
			cx.drawImage(opt.icon[0], x, y, w, h, w/-2, Math.max(22 - h/2, 10), w, h);
			if (w > 24 && !opt.local) cx.drawImage(game.assets.images.NNM_Archipelago_logo, -8, 14);
		}
	}
});
NNM.code.insertAfterAllMatchingLines('RANDOM_CASINO_EVENTS', 'player.crystalCount -= event.shortcut.price;', 'self.archipelagoState?.getCrystals(-event.shortcut.price);');
const casinoEventsFile = NNM.code.filesMatching('event/random/casino.js')[0];
for (let line = 0, flag = 0;; line++) {
	if (!flag && casinoEventsFile.lines[line].code.includes('shortcut3'))
		flag++;
	else if (flag === 1 && casinoEventsFile.lines[line].code.includes('cx.fill(') && flag++)
		casinoEventsFile.insertCodeAt(line + 1, 'if (self.archipelagoState) cx.drawImage(game.assets.images.NNM_Archipelago_key, -12, 4); else {');
	else if (flag === 2 && casinoEventsFile.lines[line].code.includes('ui_arrow_up')) {
		casinoEventsFile.insertCodeAt(line, '}');
		break;
	}
}
NNM.code.findReplaceAllLines('RANDOM_CASINO_EVENTS', '`bonus${this.reward}`', 'this.__archipelago?"__archipelago":`bonus${this.reward}`');
NNM.code.insertAfterFirstMatchingLine('RANDOM_CASINO_EVENTS', 'slot.collisionFrame = 16;', 'let __archipelago; {%%SCOPE_PASS%% __archipelago = self.archipelagoState && f(slot)} if (__archipelago) {} else', {f: slot => {
	if (slot.__archipelago) {
		archipelagoState.check(slot.__archipelago, true);
		itemTextParticle(slot, slot.__archipelago);
		slot.__archipelago = null;
	} else if (slot.type === 'enemy') {
		return;
	} else {
		archipelagoState.getCrystals(slot.reward);
	}

	NNM.game.playSound("cling2");

	return true;
}});
NNM.code.insertAfterFirstMatchingLine('RANDOM_CASTLE_EVENTS', 'player.pos.y > scene.view.pos.y + scene.view.size.y', 'if (self.archipelagoState) self.archipelagoState.deathCause = " didn\'t climb fast enough";');
NNM.code.findReplaceAllLines('RANDOM_HOLO_HQ_EVENTS', 'player.die(game);', '{if (self.archipelagoState) self.archipelagoState.deathCause = " fell off"; player.die(game);}');


//NNM.code.findReplaceAllLines('Scene', 'a.displayCollisionBox', 'a.displayCollisionBox&&a.displayCollisionBox');
