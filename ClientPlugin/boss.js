import { BossDrop } from "./pickup.js";
import {
	DynamicFloor,
	SkullBanner,
	CalliLand,
	SmokeCloud,
	Darkness,
	SinkingBoat,
	Boat,
	BossCamera,
	Throne,
	ScrollManager,
	TurretManager,
	FadeIn,
	KiaraFire,
	Spikes,
	Bridge,
	AmeSpiral,
	TowaOpen,
	FadeReveal,
	BridgeLip,
	RandomFubukiArenaManager,
	Chloe
} from "./bossEffects.js";
import * as Feat from "./feat.js";

function fadeIn1(game, event) {
	event.next = true;
	const fade = new FadeIn();
	game.scene.actors.push(fade);
	fade.update(game);
}

function fadeIn2(game, event) {
	event.next = !game.scene.actors.some(a => a instanceof FadeIn);
}

function wait(frames) {
	return (_, event) => event.next = event.timelineFrame >= frames;
}

function shouldWarn() {
	return ![11, 12, 20].includes(archipelagoState.arenaId);
}

const arenas = [
	{
		quest: 'nnq',
		event: NUINUI_FALLS_EVENTS['4_0'][0],
		bounds: { x: 1328, y: 0, w: 224, h: 96, t: 'arena' },
		skip: 'Usadrill',
		intro: event => {
			if (!event.timelineFrame) {
				event.side = NNM.getPlayer().pos.x > 16 * 94;
				NNM.game.cpuKeys.right = !(NNM.game.cpuKeys.left = event.side);
				archipelagoState.bossSpawnX = (event.side ? 85 : 94) * 16;
			}

			else if ((event.side && NNM.getPlayer().pos.x < 16 * 94) || (!event.side && NNM.getPlayer().pos.x > 16 * 85)) {
				NNM.game.resetCpuKeys();
				event.collisions = [
					{ pos: { x: 82 * 16, y: -10 * 16 }, size: { x: 16, y: 16 * 16 }},
					{ pos: { x: 97 * 16, y: -10 * 16 }, size: { x: 16, y: 16 * 16 }}
				];
				NNM.game.scene.currentSection.collisions.push(...event.collisions);
				event.boss = new PekoMiniBoss(new Vector2(82 * 16, 0), event.side);
				event.boss.checkHit = _ => false;
				event.boss._health = event.boss.maxHealth;
				event.boss.leftVel.y = 0;
				const oldIntroPhase = event.boss.introPhase;
				event.boss.introPhase = x => {
					if (!event.pekoFrameMove) {
						if (NNM.game.scene.warning) {
							event.pekoFrameMove = true;
							event.boss.leftVel.y = event.boss.moveSpeed;
						} else return;
					}
					if (event.boss.middlePhase) {
						event.boss.leftPhase = event.boss.middlePhase = event.boss.rightPhase = null;
						event.boss.leftVel = event.boss.middleVel = event.boss.rightVel = new Vector2(0, 0);
					} else if (event.boss.leftPhase && !(event.timelineFrame % 32) && NNM.game.scene.warning) {
						NNM.game.playSound('rumble');
						NNM.game.scene.shakeBuffer = 16;
					}
					oldIntroPhase(x);
				};
				NNM.game.scene.actors.push(event.boss);
				event.next = true;
			}
		}
	},
	{
		quest: 'nnq',
		event: NUINUI_FALLS_EVENTS['6_1'][0],
		bounds: { x: 1936, y: 240, w: 288, h: 112 },
		skip: 'Pekora',
		bossSpawnX: 123 * 16,
		final: true,
		endingFrames: 2,
		walkTo: -133 * 16,
		collision: { pos: { x: 139 * 16, y: 15 * 16 }, size: { x: 16, y: 48 } },
		introPost: [
			(_, event) => {
				const vec = Vector2.zero;
				event.pekora = {pos: vec, size: vec};
				event.next = true;
			},
			wait(18),
			(game, event) => {
				for (let y = 5; y < 8; y++)
					game.scene.foreground['139_1' + y] = "6";
				event.next = game.scene.shakeBuffer = 4;
				game.playSound("rumble");
			}
		]
	},
	{
		quest: 'nnq',
		event: NUINUI_CASINO_EVENTS['8_0'][0],
		bounds: { x: 2592, y: 0, w: 576, h: 160, t: 'arena' },
		bossSpawnX: 187 * 16,
		playerControl: true,
		intro: event => {
			if (event.continueAt === event.timelineFrame) {
				event.timelineFrame = 0;
				event.next = true;
			}

			if (event.continueAt)
				return;

			if (!event.timelineFrame) {
				event.skulls = new SkullBanner(event);
				NNM.game.scene.actors.unshift(event.skulls);
				if (archipelagoState.bossId !== 'Chloe')
					event.timelineFrame++;
				if (archipelagoState.bossId === 'Towa')
					NNM.game.scene.actors.push(new TowaOpen());
			}

			if (NNM.getPlayer().pos.x > 163 * 16 && !event.collisions) {
				const scene = NNM.game.scene;
				event.collisions = [
					{ pos: { x: 161 * 16, y: 7 * 16 }, size: { x: 16, y: 48 }},
					{ pos: { x: 198 * 16, y: 7 * 16 }, size: { x: 16, y: 48 }}
				];
				scene.currentSection.collisions.push(...event.collisions);

				const pos = scene.currentSection.pos.times(1 / 16).floor();
				for (let y = pos.y; y < pos.y + 1 + scene.currentSection.size.y / 16; y++) {
					for (let x = pos.x; x < pos.x + 1 + scene.currentSection.size.x / 16; x++) {
						if (x === 161 && [7, 8, 9].includes(y)) scene.foreground[`${x}_${y}`] = "5";
						if (x === 198 && [7, 8, 9].includes(y)) scene.foreground[`${x}_${y}`] = "5";
					}
				}

				scene.shakeBuffer = 4;
				NNM.game.playSound("rumble");
			}

			if (NNM.getPlayer().pos.x > 179 * 16) {
				if (!['Veiled Mori', 'Fubuki', 'Mori', 'Towa', 'Chloe'].includes(archipelagoState.bossId)) {
					NNM.game.scene.actors.push(new SmokeCloud({x: archipelagoState.bossSpawnX + 8, y: archipelagoState.arenaB - 18}, 24));
					event.continueAt = event.timelineFrame + 20;
					NNM.game.stopBGM();
					NNM.getPlayer().playerControl = false;
					NNM.game.scene.isFocus = 0;
				} else {
					event.timelineFrame = archipelagoState.bossId === 'Chloe';
					event.next = true;
				}
			}
		}
	},
	{
		quest: 'nnq',
		event: NUINUI_CASINO_EVENTS['14_2'][1],
		bounds: { x: 4480, y: 384, w: 320, h: 160, t: 'arena' },
		final: true,
		bossSpawnX: (14 * 20 + 13) * 16,
		walkTo: 14.25 * 20 * 16,
		collision: [
			{ pos: { x: (14 * 20 - 1) * 16, y: 24 * 16 }, size: { x: 16, y: 12 * 16 }},
			{ pos: { x: 15 * 20 * 16, y: 24 * 16 }, size: { x: 16, y: 12 * 16 }}
		],
		introPre: [
			(game, event) => {
				event.next = true;
				game.canvas1.style.filter = 'brightness(0%)';
			}
		],
		introPost: [
			(game, event) => {
				event.next = true;
				game.scene.actors.push(new Darkness(event));
			}
		]
	},
	{
		quest: 'nnq',
		event: NUINUI_PORT_EVENTS['1_0'][1],
		bounds: { x: 320, y: 0, w: 320, h: 176, t: 'section' },
		final: true,
		playerControl: true,
		skip: 'Marine',
		bossSpawnX: 384,
		endingFrames: 3,
		introPre: [
			parallel(NUINUI_PORT_EVENTS['1_0'][1].timeline[0], (game, event) => {
				if (!event.timelineFrame) {
					const boat = new(archipelagoState.bossId === 'Coco' ? SinkingBoat : Boat)(event);
					game.cpuKeys.left = game.scene.actors.push(boat);
					if (archipelagoState.bossId === 'Suisei') {
						boat.col = { pos: { x: 390, y: 0 }, size: { x: 1, y: 1 } };
						game.scene.currentSection.collisions.push(boat.col, boat.col.next = { pos: { x: 380, y: 0 }, size: { x: 1, y: 1 } });
						archipelagoState.arenaL = 20.5 * 16;
						archipelagoState.arenaR = (37.5 + 2) * 16;
					}
				}
			})
		],
		introPost: [
			(game, event) => event.next = game.scene.actors.push(new Aircon(new Vector2(20.5, 7.5), 1), new Aircon(new Vector2(37.5, 7.5), -1))
		],
		outroPre: [
			(game, event) => event.next = game.scene.actors = game.scene.actors.filter(a => !(a instanceof Rock || a instanceof Aircon))
		]
	},
	{
		quest: 'nnq',
		event: NUINUI_YAMATO_EVENTS['1_4'][0],
		bounds: { x: 480, y: 768, w: 496, h: 352, t: [576, 880] },
		skip: 'Fubura Tower',
		walkTo: -54 * 16,
		playerControl: true,
		collision: [
			{ pos: { x: 30 * 16, y: 63 * 16 }, size: { x: 16, y: 16 * 7 }},
			{ pos: { x: 60 * 16, y: 63 * 16 }, size: { x: 16, y: 16 * 7 }}
		],
		introPost: [
			(game, event) => {
				game.scene.iceWind = 0;
				game.scene.shakeBuffer = 4;
				//game.scene.actors.push(new FreeOnKill('renjo_shiika'));
				game.playSound('rumble');
				event.next = true;
				event.fubuzilla = {canDie: 2};
				for (let y = 0; y < 7; y++) {
					game.scene.foreground[`30_${63 + y}`] = "27";
					game.scene.foreground[`60_${63 + y}`] = "27";
				}
			}
		],
		outroPre: [
			(game, event) => {
				event.end = game.scene.fubuzillaCleared = NNM.getPlayer().playerControl = !game.playBGM('renjo_shiika');
				game.scene.currentSection.collisions = game.scene.currentSection.collisions.filter(a => !event.collisions.includes(a));
				for (let y = 0; y < 7; y++) {
					delete game.scene.foreground[`30_${63 + y}`];
					delete game.scene.foreground[`60_${63 + y}`];
				}
			}
		]
	},
	{
		quest: 'nnq',
		event: NUINUI_YAMATO_EVENTS['4_1'][0],
		bounds: { x: 1392, y: 208, w: 416, h: 112 },
		bossSpawnX: 104.5 * 16,
		playerControl: true,
		intro: event => {
			if (NNM.getPlayer().pos.y <= 18 * 16) {
				event.next = true;
				NNM.game.playSound('rumble');
				const scene = NNM.game.scene;
				scene.shakeBuffer = 4;
				event.collisions = [
					{ pos: { x: 88 * 16, y: 20 * 16 }, size: { x: 16 * 3, y: 16 }},
					{ pos: { x: 109 * 16, y: 20 * 16 }, size: { x: 16 * 3, y: 16 }}
				];
				scene.currentSection.collisions.push(...event.collisions);
				scene.actors.push(new BossCamera(event.bossActor || NNM.getPlayer(), 12 * 16));
				scene.isFocus = 0;
				for (let x = 0; x < 3; x++) {
					scene.foreground[`${88 + x}_19`] = "f";
					scene.foreground[`${88 + x}_20`] = "e";
					scene.foreground[`${109 + x}_19`] = "f";
					scene.foreground[`${109 + x}_20`] = "e";
				}
				NNM.game.stopBGM();
				NNM.game.resetCpuKeys();
				NNM.getPlayer().playerControl = false;
			}
		}
	},
	{
		quest: 'nnq',
		event: NUINUI_YAMATO_EVENTS['14_0'][0],
		bounds: { x: 4480, y: 0, w: 320, h: 160, t: 'arena' },
		bossSpawnX: (14 * 20 + 13) * 16,
		walkTo: 14.25 * 20 * 16,
		collision: [
			{ pos: { x: (14 * 20 - 1) * 16, y: -12 * 16 }, size: { x: 16, y: 24 * 16 }},
			{ pos: { x: 15 * 20 * 16, y: -12 * 16 }, size: { x: 16, y: 24 * 16 }}
		]
	},
	{
		quest: 'nnq',
		event: NUINUI_CASTLE_EVENTS['6_4'][0],
		bounds: { x: 1952, y: 800, w: 256, h: 128, t: [2000, 2160] },
		walkTo: (6 * 20 + 3) * 16,
		collision: [
			{ pos: { x: (6 * 20 + 1) * 16, y: (4 * 12 + 7) * 16 }, size: { x: 16, y: 3 * 16 }},
			{ pos: { x: (7 * 20 - 2) * 16, y: (4 * 12 + 7) * 16 }, size: { x: 16, y: 3 * 16 }}
		],
		introPost: [
			(game, event) => {
				event.next = true;
				game.scene.shakeBuffer = 4;
				game.playSound('rumble');
				for (let y = 0; y < 3; y++) {
					game.scene.foreground[`121_${55 + y}`] = "12";
					game.scene.foreground[`138_${55 + y}`] = "12";
				}
			}
		]
	},
	{
		quest: 'nnq',
		event: NUINUI_CASTLE_EVENTS['6_3'][2],
		bounds: { x: 2128, y: 592, w: 224, h: 144 },
		walkTo: -(7.5 * 20 - 2) * 16,
		playerControl: true,
		bossSpawnX: (6 * 20 + 15) * 16,
		collision: [
			{ pos: { x: (6.5 * 20) * 16, y: (3 * 12 + 1) * 16 }, size: { x: 16, y: 3 * 16 }},
			{ pos: { x: (7.5 * 20 - 1) * 16, y: (3 * 12 + 1) * 16 }, size: { x: 16, y: 3 * 16 }}
		],
		introPre: [
			(game, event) => {
				if (!event.timelineFrame && archipelagoState.bossId === 'Towa')
					game.scene.actors.push(new TowaOpen());
				if (event.next = NNM.getPlayer().pos.x < (7.5 * 20 - 2) * 16) {
					NNM.getPlayer().playerControl = false;
					game.stopBGM(true);
				}
			}
		],
		introPost: [
			(game, event) => {
				event.next = true;
				game.scene.shakeBuffer = 4;
				game.playSound('rumble');
				game.scene.lockedViewPos = new Vector2(20 * 6.5 * 16, game.scene.view.pos.y);
				for (let y = 0; y < 3; y++) {
					game.scene.foreground[`130_${37 + y}`] = "29";
					game.scene.foreground[`149_${37 + y}`] = "29";
				}
			}
		],
		outroPre: [
			(game, event) => {
				for (const actor of game.scene.actors) {
					if (actor instanceof Aircon) {
						actor.dir = 0;
					}
				}
				event.next = true;
			}
		]
	},
	{
		quest: 'nnq',
		event: NUINUI_CASTLE_EVENTS['1_3'][1],
		bounds: { x: 320, y: 576, w: 640, h: 160, t: 'arena' },
		walkTo: -44 * 16,
		bossSpawnX: 632,
		skip: 'Demon Lord Miko',
		endingFrames: 8,
		collision: [
			{ pos: { x: 19 * 16, y: 36 * 16 }, size: { x: 16, y: 12 * 16 }},
			{ pos: { x: 60 * 16, y: 36 * 16 }, size: { x: 16, y: 12 * 16 }}
		],
		introPost: [
			(game, event) => {
				game.scene.actors.push(new BossCamera(event.bossActor || NNM.getPlayer(), 3 * 12 * 16));
				event.next = true;
				archipelagoState.scout(3);
			}
		],
		outroPre: [
			(game, event) => {
				NNM.getPlayer().playerControl = !(event.next = true);
				if (game.timer && game.mode !== 'noel') {
					game.scene.finalTime = new Date().getTime() - game.timer.getTime();
					game.timer = null;
					archipelagoState.check(3);
				}
			}
		]
	},
	{
		quest: 'nnq',
		event: NUINUI_CASTLE_EVENTS['1_2'][0],
		bounds: { x: 368, y: 384, w: 224, h: 160, t: 'arena' },
		bossSpawnX: 33 * 16,
		skip: 'Flare',
		intro: event => {
			if (event.next = !NNM.getPlayer().vel.x) {
				const scene = NNM.game.scene;
				scene.currentSection.collisions.push({ pos: { x: 22 * 16, y: 33 * 16 }, size: { x: 16, y: 16 }});
				scene.shakeBuffer = 4;
				NNM.game.playSound('rumble');
				for (let x = 0; x < 3; x++) scene.foreground[`${20 + x}_33`] = x === 2 ? "5" : "4";
				for (let x = 0; x < 3; x++) scene.foreground[`${20 + x}_23`] = x === 2 ? "5" : "4";
				for (let x = 0; x < 3; x++) scene.foreground[`${37 + x}_23`] = x === 0 ? "3" : "4";
				scene.background[`23_23`] = "2";
				scene.background[`24_23`] = "16";
				scene.background[`25_23`] = "16";
				scene.background[`26_23`] = "2";
				scene.background[`27_23`] = "1";
				scene.background[`28_23`] = "2";
				scene.background[`29_23`] = "16";
				scene.background[`30_23`] = "16";
				scene.background[`31_23`] = "2";
				scene.background[`32_23`] = "1";
				scene.background[`33_23`] = "2";
				scene.background[`34_23`] = "16";
				scene.background[`35_23`] = "16";
				scene.background[`36_23`] = "2";
			}
		},
		introPost: [
			(game, event) => {
				if (event.timelineFrame === 60) {
					game.scene.towerScroll = 2;
					game.scene.shakeBuffer = 4;
					game.playSound('rumble');
					if (event.bossActor)
						game.scene.actors.push(new ScrollManager(event.bossActor));
				}
				else
					event.next = event.timelineFrame === 90;
			}
		],
		outroPre: [
			(game, event) => {
				NNM.getPlayer().playerControl = false;
				if (event.timelineFrame === 60) {
					game.saveData.data['noel-mode'] = game.mode === 'noel';
					game.scene.towerScroll = .5;
					game.scene.shakeBuffer = 4;
					game.playSound('rumble');
				} else
					event.next = event.timelineFrame === 180;
			}
		]
	},
	{
		quest: 'nnq',
		event: NUINUI_CASTLE_EVENTS['1_1'][1],
		bounds: { x: 368, y: 192, w: 224, h: 160, t: 'section' },
		final: true,
		skip: 'Demon',
		bossSpawnX: 33.5 * 16,
		endingFrames: 4,
		introPre: [
			(game, event) => {
				archipelagoState.scout(4);
				game.scene.actors.push(event.demon = new TurretManager(event));
				game.saveData.data['noel-mode'] = false;
				event.next = game.scene.actors.find(a => a instanceof ShirakenHelper).toFilter = !event.demon.update(game);
			}
		],
		introPost: [
			NUINUI_CASTLE_EVENTS['1_1'][1].timeline[0],
		],
		outroPre: [
			(game, event) => {
				game.scene.enableHUD = !(event.next = true);
				NNM.getPlayer().playerControl = false;
				archipelagoState.check(4);
			}
		]
	},
	{
		quest: 'nnq',
		event: NUINUI_HOLO_HQ_EVENTS['0_2'][1],
		skip: 'Kiara',
		bounds: { x: 0, y: 384, w: 320, h: 160, t: 'section' },
		collision: [
			{ pos: { x: -1 * 16, y: 24 * 16 }, size: { x: 16, y: 12 * 16 }},
			{ pos: { x: 20 * 16, y: 24 * 16 }, size: { x: 16, y: 12 * 16 }},
		],
		bossSpawnX: 14.5 * 16,
		introPre: [fadeIn1],
		introPost: [
			fadeIn2,
			(game, event) => event.next = game.scene.actors.push(new KiaraFire())
		]
	},
	{
		quest: 'nnq',
		event: NUINUI_HOLO_HQ_EVENTS['1_1'][1],
		skip: 'Mori',
		bounds: { x: 320, y: 192, w: 320, h: 160, t: 'arena' },
		collision: [
			{ pos: { x: 19 * 16, y: 12 * 16 }, size: { x: 16, y: 12 * 16 }},
			{ pos: { x: 40 * 16, y: 12 * 16 }, size: { x: 16, y: 12 * 16 }}
		],
		bossSpawnX: 34.5 * 16,
		introPre: [fadeIn1],
		introPost: [fadeIn2]
	},
	{
		quest: 'nnq',
		event: NUINUI_HOLO_HQ_EVENTS['0_1'][0],
		skip: 'Gura',
		bounds: { x: 48, y: 192, w: 224, h: 160, t: 'section' },
		collision: [
			{ pos: { x: -1 * 16, y: 12 * 16 }, size: { x: 16, y: 12 * 16 }},
			{ pos: { x: 20 * 16, y: 12 * 16 }, size: { x: 16, y: 12 * 16 }}
		],
		bossSpawnX: (20 - 5.5 - 1) * 16,
		introPre: [fadeIn1],
		introPost: [
			fadeIn2,
			(game, event) => event.next = game.scene.actors.push(new Spikes())
		]
	},
	{
		quest: 'nnq',
		event: NUINUI_HOLO_HQ_EVENTS['2_1'][1],
		skip: 'Ina',
		bounds: { x: 640, y: 192, w: 320, h: 160, t: 'arena' },
		bossSpawnX: 45 * 16,
		introPre: [
			NUINUI_HOLO_HQ_EVENTS['2_1'][1].timeline[0],
			(game, event) => {
				event.next = true;
				event.collisions[0].size.y = 150;
				event.collisions[2].pos.y = 0;
				if (!['Veiled Mori', 'Fubuki', 'Mori', 'Gura', 'Kanata', 'Coco', 'La+', 'Koyodrill'].includes(archipelagoState.bossId)) {
					game.scene.actors.push(new SmokeCloud({x: archipelagoState.bossSpawnX + 8, y: archipelagoState.arenaB - 18}, 60));
					NNM.getPlayer().playerControl = false;
					game.scene.isFocus = 0;
				} else {
					event.index++;
				}
			},
			wait(40)
		],
		introPost: [
			(game, event) => NNM.getPlayer().dir = !(event.next = game.scene.actors.push(new Bridge(game))),
			(game, event) => {
				if (event.next = event.timelineFrame === 30) {
					for (let i = 40; i < 60; i++) {
						for (let j = 1; j < 4; j++) {
							delete game.scene.foreground[`${i}_2${j}`];
						}
					}
				}
			}
		],
		outroPre: [
			(game, event) => {
				game.scene.rain = !(event.next = true);
				for (let i = 40; i < 60; i++) {
					game.scene.background[`${i}_22`] = '40';
					game.scene.background[`${i}_23`] = '41';
				}
			}
		],
	},
	{
		quest: 'nnq',
		event: NUINUI_HOLO_HQ_EVENTS['4_1'][0],
		skip: 'Ame',
		bounds: { x: 1312, y: 224, w: 256, h: 128 },
		bossSpawnX: 94.5 * 16,
		introPre: [fadeIn1],
		introPost: [fadeIn2]
	},
	{
		quest: 'nnq',
		event: NUINUI_HEAVEN_EVENTS['8_0'][1],
		bounds: { x: 2560, y: 0, w: 320, h: 144, t: 'section' },
		walkTo: -(8 * 20 + 16.5) * 16,
		floorData: [{ pos: { x: 2688, y: 144 }, size: 64 }, { pos: { x: 2560, y: 160 }, size: 64 }, { pos: { x: 2816, y: 160 }, size: 64 }],
		collision: [
			{ pos: { x: (8 * 20 - 1) * 16, y: -12 * 16 }, size: { x: 16, y: 24 * 16 }},
			{ pos: { x: (9 * 20) * 16, y: -12 * 16 }, size: { x: 16, y: 24 * 16 }}
		],
		outroPre: [
			(game, event) => (
				(NNM.getPlayer().playerControl = event.end = game.scene.kanataBossCleared = event.timelineFrame === 180) &&
				game.scene.actors.push(new BossDrop(new Vector2(8.5 * 20 * 16 - 10, 3 * 16))) &&
				(game.scene.currentSection.collisions = game.scene.currentSection.collisions.filter(collision => !event.collisions.includes(collision))) &&
				(game.bgm || game.playBGM('kiseki'))
			)
		]
	},
	{
		quest: 'nnq',
		event: NUINUI_HEAVEN_EVENTS['8_6'][0],
		bounds: { x: 2576, y: 1168, w: 288, h: 144, t: [2672, 2768] },
		bossSpawnX: 2824,
		collision: [{ pos: { x: (8 * 20) * 16, y: (6 * 12 + 7) * 16 }, size: { x: 16, y: 3 * 16 }}],
		introPost: [
			(game, event) => {
				const player = NNM.getPlayer();
				if (event.bossActor instanceof Suisei) {
					if (player.pos.x > 2576 + 32) {
						game.cpuKeys.left = player.isGrounded || undefined;
					} else {
						game.cpuKeys.left = undefined;
						event.next = player.dir;
						player.dir = true;
					}
				} else event.next = player.isGrounded;
			}
		]
	},
	{
		quest: 'nnq',
		event: NUINUI_HEAVEN_EVENTS['0_0'][0],
		bounds: { x: 0, y: 32, w: 320, h: 128 },
		bossSpawnX: 5.5 * 16,
		walkTo: -15 * 16,
		skip: 'Towa',
		final: true,
		collision: [
			{ pos: { x: -1 * 16, y: 0 }, size: { x: 16, y: 12 * 16 }},
			{ pos: { x: 20 * 16, y: 0 }, size: { x: 16, y: 12 * 16 }}
		],
		introPre: [
			(game, event) => event.next = !(game.scene.lockedViewPos = null)
		],
		outroPre: [
			wait(150),
			(game, event) => {
				event.boss = { pos: { x: 0, y: 0 }, size: { x: 0, y: 0 } };
				event.next = game.scene.towaBossCleared = true;
				game.scene.currentSection.collisions = game.scene.currentSection.collisions.filter(c => !event.collisions.includes(c));
			}
		]
	},
	{
		quest: 'prq',
		event: RANDOM_FALLS_EVENTS['5_2'][0],
		bounds: { x: 1616, y: 400, w: 288, h: 112 },
		bossSpawnX: 117 * 16,
		floorData: [{ pos: { x: 1728, y: 480 }, size: 64 }, { pos: { x: 1600, y: 512 }, size: 80 }, { pos: { x: 1840, y: 512 }, size: 80 }, { pos: { x: 1616, y: 544 }, size: 288 }],
		collision: [
			{ pos: { x: 100 * 16, y: 29 * 16 }, size: { x: 1 * 16, y: 3 * 16 } },
			{ pos: { x: 119 * 16, y: 29 * 16 }, size: { x: 1 * 16, y: 3 * 16 } }
		],
		introPre: [
			RANDOM_FALLS_EVENTS['5_2'][0].timeline[0],
			parallel(RANDOM_FALLS_EVENTS['5_2'][0].timeline[1], (game, event) => (event.robot && !event.robot.toFilter) && (event.robot.toFilter = game.seenIntro = game.scene.actors.push(new FadeReveal(event)))),
		],
		introPost: [
			wait(29),
			(game, event) => {
				event.next = game.scene.shakeBuffer = 4;
				game.playSound("rumble");
				for (const { pos, size } of event.collisions) {
					for (let y = pos.y; y < pos.y + size.y; y += 16) {
						for (let x = pos.x; x < pos.x + size.x; x += 16) {
							game.scene.foreground[`${x / 16}_${y / 16}`] = "e";
						}
					}
				}
			},
			wait(29)
		],
		outroPre: [
			(game, event) => event.next = game.scene.koyoriBossCleared = true
		]
	},
	{
		quest: 'prq',
		event: RANDOM_FALLS_EVENTS['6_4'][0],
		bounds: { x: 1920, y: 768, w: 320, h: 160, t: 'arena' },
		final: true,
		bossSpawnX: (6 * 20 + 4.25) * 16,
		walkTo: -(6 * 20 + 14.75) * 16,
		skip: 'Flare',
		collision: [
			{ pos: { x: 1920 - 1, y: 0 }, size: { x: 1, y: 1e3 } },
			{ pos: { x: 1920 + 320, y: 0 }, size: { x: 1, y: 1e3 } },
		],
		outroPre: [
			(game, event) => game.scene.bossKillEffect || (game.scene.currentSection.collisions = game.scene.currentSection.collisions.filter(collision => collision !== event.collision, event.next = event.flare = {canDie: 1})),
		]
	},
	{
		quest: 'prq',
		event: RANDOM_CASINO_EVENTS['8_0'][0],
		bounds: { x: 2608, y: 64, w: 224, h: 96 },
		bossSpawnX: (8 * 20 + 13) * 16,
		floorData: [{ pos: { x: 2688, y: 144 }, size: 64 }, { pos: { x: 2608, y: 144 }, size: 16 }, { pos: { x: 2816, y: 144 }, size: 16 }, { pos: { x: 2608, y: 160 }, size: 224 }],
		collision: { pos: { x: 2592, y: 80 }, size: { x: 16, y: 64 } },
		walkTo: 2560 + 6 * 16,
		skip: 'Chloe',
		introPre: [
			(game, event) => game.scene.chloeCleared ? event.end = NNM.getPlayer().playerControl = true : event.next = !game.stopBGM()
		],
		introPost: [
			(game, event) => {
				event.next = game.scene.shakeBuffer = 4;
				game.playSound("rumble");
				for (let y = 5; y < 9; y++)
					game.scene.foreground['162_' + y] = '7';
			}
		],
		outroPre: [
			wait(119),
			(game, event) => {
				game.scene.currentSection.collisions = game.scene.currentSection.collisions.filter(collision => collision !== event.collision);
				if (!game.bgm) game.playBGM('play_dice');
				event.end = event.chloe = { draw: _ => 0, pos: {} };
				event.timeline[event.index + 1](game, event);
				for (let y = 5; y < 9; y++)
					delete game.scene.foreground['162_' + y];
			}
		]
	},
	{
		quest: 'prq',
		event: RANDOM_CASINO_EVENTS['1_5'][0],
		bounds: { x: 320, y: 960, w: 320, h: 160, t: 'arena' },
		bossSpawnX: 25.5 * 16,
		walkTo: -34.5 * 16,
		final: true,
		skip: 'Mori',
		collision: [
			{ pos: { x: 319, y: 0 }, size: { x: 1, y: 2e3 } },
			{ pos: { x: 640, y: 0 }, size: { x: 1, y: 2e3 } }
		],
		outroPre: [
			(game, event) => game.scene.currentSection.collisions = game.scene.currentSection.collisions.filter(collision => !event.collisions.includes(collision), event.next = game.scene.calliCleared = true)
		]
	},
	{
		quest: 'prq',
		event: RANDOM_PORT_EVENTS['5_6'][0],
		bounds: { x: 1600, y: 1168, w: 320, h: 144 },
		bossSpawnX: 1824,
		walkTo: 5.25 * 20 * 16,
		skip: 'Gura',
		collision: [
			{ pos: { x: (5 * 20 - 1) * 16, y: (6 * 12) * 16 }, size: { x: 16, y: 12 * 16 }},
			{ pos: { x: (6 * 20) * 16, y: (6 * 12) * 16 }, size: { x: 16, y: 12 * 16 }}
		]
	},
	{
		quest: 'prq',
		event: RANDOM_PORT_EVENTS['9_3'][0],
		bounds: { x: 2880, y: 576, w: 320, h: 160, t: 'arena' },
		bossSpawnX: (9 * 20 + 13) * 16,
		walkTo: 9.25 * 20 * 16,
		final: true,
		collision: [
			{ pos: { x: 2880 - 1, y: 0 }, size: { x: 1, y: 1e3 } },
			{ pos: { x: 2880 + 320, y: 0 }, size: { x: 1, y: 1e3 } }
		],
		outroPre: [
			(game, event) => event.next = game.scene.currentSection.collisions = game.scene.currentSection.collisions.filter(collision => !event.collisions.includes(collision))
		]
	},
	{
		quest: 'prq',
		event: RANDOM_YAMATO_EVENTS['7_2'][0],
		bounds: { x: 2272, y: 416, w: 576, h: 128 },
		bossSpawnX: 159.5 * 16,
		playerControl: true,
		intro: event => {
			if (NNM.getPlayer().pos.y <= 32 * 16) {
				const scene = NNM.game.scene;
				event.collisions = [];
				for (const y of [146, 171]) {
					for (let x = 0; x < 3; x++) {
						scene.foreground[`${y + x}_33`] = "f";
						scene.foreground[`${y + x}_34`] = "e";
					}
					event.collisions.push({ pos: { x: y * 16, y: 34 * 16 }, size: { x: 16 * 3, y: 16 }});
				}
				scene.currentSection.collisions.push(...event.collisions);
				scene.isFocus = 0;
				NNM.game.playSound('rumble');
				scene.shakeBuffer = 4;
				scene.actors.push(new BossCamera(event.bossActor || NNM.getPlayer(), 24 * 16));
				NNM.game.stopBGM();
				event.next = event.iroha = { pos: {}, size: {} };
			}
		},
		outroPre: [
			wait(119),
			(game, event) => event.timeline[event.index + 1](game, event, game.scene.lockedViewPos = {}, NNM.getPlayer().playerControl = true)
		]
	},
	{
		quest: 'prq',
		event: RANDOM_YAMATO_EVENTS['17_0'][1],
		bounds: { x: 5472, y: 0, w: 256, h: 160, t: 'section' },
		bossSpawnX: (17 * 20 + 13) * 16,
		walkTo: 17.25 * 20 * 16,
		final: true,
		collision: [
			{ pos: { x: 5440 - 1, y: 0 }, size: { x: 1, y: 1e3 } },
			{ pos: { x: 5440 + 320, y: 0 }, size: { x: 1, y: 1e3 } }
		],
		introPost: [
			(game, event) => event.next = game.scene.actors.push(new RandomFubukiArenaManager())
		],
		outroPre: [
			(game, event) => {
				game.scene.currentSection.collisions = game.scene.currentSection.collisions.filter(collision => !event.collisions.includes(collision));
				for (const x of [0, 1, 18, 19]) {
					game.scene.foreground[`${17 * 20 + x}_10`] = '23';
					game.scene.currentSection.collisions.push({ pos: { x: (17 * 20 + x) * 16, y: 10 * 16 }, size: { x: 16, y: 16 }});
				}
				event.next = true;
			}
		]
	},
	{
		quest: 'prq',
		event: RANDOM_CASTLE_EVENTS['15_12'][0],
		bounds: { x: 4832, y: 2304, w: 256, h: 160, t: 'arena' },
		walkTo: (15 * 20 + 3) * 16,
		bossSpawnX: (16 * 20 - 4) * 16,
		collision: [
			{ pos: { x: (15 * 20 + 1) * 16, y: (12 * 12 + 7) * 16 }, size: { x: 16, y: 3 * 16 }},
			{ pos: { x: (16 * 20 - 2) * 16, y: (12 * 12 + 7) * 16 }, size: { x: 16, y: 3 * 16 }}
		],
		introPost: [
			(game, event) => {
				for (let y = 0; y < 3; y++) {
					game.scene.foreground[`318_${151 + y}`] = game.scene.foreground[`301_${151 + y}`] = "31";
				}
				event.next = game.scene.shakeBuffer = 4;
				game.playSound('rumble');
			}
		]
	},
	{
		quest: 'prq',
		event: RANDOM_CASTLE_EVENTS['17_0'][1],
		bounds: { x: 5504, y: 0, w: 192, h: 160, t: 'section' },
		walkTo: -(17 * 20 + 13.75) * 16,
		bossSpawnX: (17 * 20 + 5.25) * 16,
		final: true,
		skip: 'La+',
		endingFrames: 4,
		introPost: [
			wait(60),
			(game, event) => {
				for (let x = 0; x < 4; x++) { 
					delete game.scene.foreground[`${356 + x}_10`];
					delete game.scene.background[`${356 + x}_10`];
				}
				event.next = game.scene.currentSection.collisions = game.scene.currentSection.collisions.filter(collision => collision.pos.x < 356 * 16);
			}
		]
	},
	{
		quest: 'prq',
		event: RANDOM_HOLO_HQ_EVENTS['0_0'][2],
		bounds: { x: 48, y: 0, w: 224, h: 160, t: 'section' },
		bossSpawnX: (20 - 7.5) * 16,
		final: true,
		skip: 'Koyodrill',
		endingFrames: 4,
		intro: event => {
			event.next = event.koyori = NNM.getPlayer().playerControl && { update: _ => {}, draw: _ => {} };
			NNM.getPlayer().playerControl = false;
			if (archipelagoState.bossId === 'Ina') {
				const x = NNM.game.scene.lockedViewPos?.x || 0;
				NNM.game.scene.lockedViewPos = new Vector2(x > -16 ? x - .5 : lerp(x, -32, 1/32), 0);
			}
		},
		outroPre: [wait(119)]
	}
];

function warn(name, icon, phase, bgm, delay=0, minWarning=0, events) {
	return (game, event) => {
		if (!event.timelineFrame) {
			NNM.getPlayer().playerControl = false;
			if (!game.bgmFadeOut && bgm && bgm !== archipelagoState.bgmId) game.stopBGM();
		}
		if (events && events[event.timelineFrame])
			events[event.timelineFrame](event);
		if (event.timelineFrame >= delay && !event.warnStarted) {
			event.warnStarted = true;
			game.scene.warning = shouldWarn();
			game.scene.boss = event.bossActor;
			game.scene.boss.icon = icon;
			if (name)
				game.scene.bossText = new LocaleElem(game, name);
		} else if (event.warnStarted && event.bossActor.canDie && event.timelineFrame >= minWarning) {
			event.warnStarted = game.scene.warning = false;
			event.bossActor.phase = phase;
			if (bgm && bgm !== archipelagoState.bgmId)
				game.playBGM(bgm);
			NNM.getPlayer().playerControl = true;
			NNM.getPlayer().animationLocked = false;
			event.next = true;
		}
	};
}

function roof(game, event) {
	event.next = game.scene.currentSection.collisions.push({ pos: { x: archipelagoState.arenaL, y: game.scene.currentSection.pos.y - 1 }, size: { x: archipelagoState.arenaR - archipelagoState.arenaL, y: 1 } });
}

function fight(clear, setDefeatedPhase, allowTravelBelowSection) {
	return (game, event) => {
		const player = NNM.getPlayer();

		if (event.bossActor.health <= 0 && event.bossActor.canDie) {
			if (archipelagoState.arenaFinal && game.timer && !(event.bossActor instanceof Bibi)) {
				const time = new Date().getTime() - game.timer.getTime();
				game.scene.finalTime = time;
				game.timer = null;
			}
			
			if (clear) {
				for (const a of game.scene.actors) {
					for (const type of clear) {
						if (a instanceof type) {
							a.toFilter = true;
							break;
						}
					}
				}
			}

			if (archipelagoState.bossId !== 'Robot' && !(event.bossActor instanceof Boss)) {
				game.scene.bossKillEffect = 60;
				game.playSound('cling');
			}
			
			game.scene.isFocus = 0;
			
			if ((archipelagoState.arenaId !== 10 || game.mode === 'noel') && archipelagoState.arenaId !== 18 && !(event.bossActor instanceof Bibi))
				archipelagoState.item(event.bossActor.hands ? new Vector2(game.scene.view.pos.x + 150, archipelagoState.arenaT + 8) : event.bossActor.pos.value(), 'boss');

			if (setDefeatedPhase)
				event.bossActor.phase = 'defeated';

			game.scene.boss = null;
			game.scene.bossText = null;
			game.stopBGM();
			player.playerControl = archipelagoState.arenaId === 22;
			event.next = true;
		}

		if (player.pos.x < game.scene.currentSection.pos.x) {
			player.pos.x = game.scene.currentSection.pos.x;
			player.vel.x = 0;
		}

		else if (player.pos.x > game.scene.currentSection.pos.x + game.scene.currentSection.size.x - 16) {
			player.pos.x = game.scene.currentSection.pos.x + game.scene.currentSection.size.x - 16;
			player.vel.x = 0;
		}

		if (player.pos.y < game.scene.currentSection.pos.y) {
			player.pos.y = game.scene.currentSection.pos.y
			player.vel.y = 0;
		}

		if (!allowTravelBelowSection && event.bossActor.health && event.bossActor.pos.y > game.scene.currentSection.pos.y + game.scene.currentSection.size.y + 15 && event.bossActor.pos.y < 1e5)
			event.bossActor.pos = new Vector2((archipelagoState.arenaL + archipelagoState.arenaR - event.bossActor.size.x) >> 1, game.scene.currentSection.pos.y - event.bossActor.size.y);

		/*
		if (restrainBoss) {
			if (event.bossActor.pos.x < game.scene.currentSection.pos.x) {
				event.bossActor.pos.x = game.scene.currentSection.pos.x;
				if (event.bossActor.vel) event.bossActor.vel.x = 0;
			}

			else if (event.bossActor.pos.x > game.scene.currentSection.pos.x + game.scene.currentSection.size.x - 16) {
				event.bossActor.pos.x = game.scene.currentSection.pos.x + game.scene.currentSection.size.x - 16;
				if (event.bossActor.vel) event.bossActor.vel.x = 0;
			}
		}
		*/
	};
}

function parallel() {
	return (a, b) => {
		for (const f of arguments)
			f(a, b);
	};
}

function calli(skullBoss) {
	return {
		setup: event => {
			event.bossActor = new Calli(new Vector2(archipelagoState.bossSpawnX, 0), skullBoss ? 32 : 64);
			event.bossActor.archipelagoIgnoreEventCollisions = event;
			event.bossActor.setAnimation('hide');
			if (skullBoss) {
				event.bossActor.skullBoss = {takeHit:_=>{}};
				event.bossActor.typeWeakness = {};
			}
			event.bossActor.lookAt = a => event.bossActor.dir = CollisionBox.center(event.bossActor).x < a.x;
			const f = _ => {
				event.bossActor.pos.y = archipelagoState.arenaB - 32;
				event.bossActor.lookAt(CollisionBox.center(NNM.getPlayer()));
				if (
					event.bossActor.pos.x > NNM.getPlayer().pos.x && (
						archipelagoState.arenaR > Math.max(NNM.game.scene.view.pos.x, NNM.game.scene.currentSection.pos.x) + NNM.game.scene.view.size.x + 48 ||
						archipelagoState.arenaR === NNM.game.scene.currentSection.pos.x + NNM.game.scene.view.size.x
					)
				) {
					event.bossActor.pos.x = Math.max(NNM.game.scene.view.pos.x, NNM.game.scene.currentSection.pos.x) + NNM.game.scene.view.size.x + 16;
					event.bossActor.vel = new Vector2(-2, -4);
					event.bossActor.setAnimation('jump2');
				} else if (
					event.bossActor.pos.x < NNM.getPlayer().pos.x && archipelagoState.arenaId !== 9 && (
						archipelagoState.arenaL < Math.min(NNM.game.scene.view.pos.x, NNM.game.scene.currentSection.pos.x + NNM.game.scene.currentSection.size.x - NNM.game.scene.view.size.x) - 48 ||
						archipelagoState.arenaL === NNM.game.scene.currentSection.pos.x
					)
				) {
					event.bossActor.pos.x = Math.min(NNM.game.scene.view.pos.x, NNM.game.scene.currentSection.pos.x + NNM.game.scene.currentSection.size.x - NNM.game.scene.view.size.x) - 16;
					event.bossActor.vel = new Vector2(2, -4);
					event.bossActor.setAnimation('jump2');
				} else {
					event.bossActor.vel = Vector2.zero;
				}
			};
			if (NNM.getPlayer().playerControl || archipelagoState.arenaId === 10) {
				event.bossActor.pos.y = Infinity;
				event.calliJump = f;
			} else f();
			NNM.game.scene.actors.push(new CalliLand(event.bossActor));
		},
		timeline: [
			warn(skullBoss ? 'unknown' : 'mori_calliope', 1, 'idle', 'mori', 0, 150, {
				'0': event => event.calliJump && event.calliJump(),
				'150': event => event.bossActor.scythe.intro = !(event.bossActor.scythe.shakeBuffer = 15)
			}),
			fight([Calli, CalliScythe])
		]
	};
}

const bosses = {
	None: { timeline: [] },
	Usadrill: {
		setup: event => {
			event.bossActor = new PekoraBoss(new Vector2(archipelagoState.bossSpawnX, archipelagoState.arenaB - 32), 1);
			event.bossActor.setAnimation('idle');
			event.bossActor.dir = true;
			archipelagoState.arenaL += 48;
			archipelagoState.arenaR -= 48;
		},
		timeline: [
			(game, event) => {
				if (NNM.getPlayer().pos.x < archipelagoState.arenaR - 24) {
					event.next = !game.resetCpuKeys();
					game.playSound('peko');
					event.bossActor.setAnimation('laugh');
					event.raised = event.targetRaised = 0;
				} else {
					game.cpuKeys.left = true;
				}
			},
			wait(78),
			(_, event) => event.bossActor.setAnimation(event.next = 'idle'),
			(game, event) => {
				const increase = Math.round(event.targetRaised = lerp(event.targetRaised, 68, .03)) - event.raised;
				event.raised += increase;
				archipelagoState.arenaB -= increase;
				for (const actor of game.scene.actors) {
					if (actor instanceof Bridge)
						for (const segment of actor.segments)
							segment.pos.y -= increase;
					else if (actor.pos.y > archipelagoState.arenaT)
						actor.pos.y -= increase;
				}
				event.next = event.raised > 63;
			},
			(game, event) => {
				event.bossActor.setAnimation('jump');
				event.bossActor.vel.y = -4;
				event.next = event.bossActor.__archipelagoNoCollide = true;
				game.playSound("jump");
			},
			(game, event) => event.next = !CollisionBox.intersects(event.bossActor, game.scene.view),
			(game, event) => {
				event.next = event.bossActor.toFilter = event.bossActor.pos;
				game.playBGM('robotic_foe');
				game.scene.actors.push(event.bossActor = new PekoMiniBoss(new Vector2(archipelagoState.arenaL - 16, 0)));
				event.bossActor.size.y = event.next.y = archipelagoState.arenaT + 192;
				event.bossActor.peko = event.next;
				event.bossActor.icon = 2;
				game.scene.boss = event.bossActor;
				game.scene.bossText = new LocaleElem(game, 'usadrill');
				game.scene.warning = shouldWarn();
				game.scene.currentSection.collisions.push(
					{ pos: { x: archipelagoState.arenaL - 1, y: archipelagoState.arenaT }, size: { x: 1, y: 192 } },
					{ pos: { x: archipelagoState.arenaR, y: archipelagoState.arenaT }, size: { x: 1, y: 192 } }
				);
				for (const part of event.bossActor.leftParts)
					part.pos.y += archipelagoState.arenaT;
				for (const part of event.bossActor.middleParts)
					part.pos.y += archipelagoState.arenaT;
				for (const part of event.bossActor.rightParts)
					part.pos.y += archipelagoState.arenaT + 96;
				for (let i = 0; i < 5; i++) {
					event.bossActor.leftParts.push({ pos: event.bossActor.leftParts.at(-1).pos.plus({ x: 0, y: event.bossActor.leftParts[1].pos.y - event.bossActor.leftParts[0].pos.y }), size: event.bossActor.leftParts[0].size });
					event.bossActor.rightParts.push({ pos: event.bossActor.rightParts.at(-1).pos.plus({ x: 0, y: event.bossActor.rightParts[1].pos.y - event.bossActor.rightParts[0].pos.y }), size: event.bossActor.rightParts[0].size });
				}
			},
			(game, event) => {
				if (event.bossActor.phase !== 'intro') {
					game.scene.warning = !(NNM.getPlayer().playerControl = event.next = event.bossActor.canDie = true);
				}

				if (!(event.timelineFrame % 32)) {
					game.playSound('rumble');
					game.scene.shakeBuffer = 16;
				}
			},
			fight([Bullet, Rocket]),
			(game, event) => {
				event.bossActor.phase = 'death';
				event.bossActor.laserTarget = null;
				event.bossActor.middleVel = Vector2.zero;
				if (!(event.timelineFrame % 32))
					game.playSound('rumble');
				event.bossActor.toFilter = event.next = event.timelineFrame > 159;
			}
		]
	},
	Pekora: {
		setup: event => {
			event.bossActor = new PekoraBoss(new Vector2(archipelagoState.bossSpawnX, archipelagoState.arenaB - 32), NNM.game.currentQuest === 'nuinui' && NNM.game.currentStage === 'falls' ? 32 : 64);
			event.bossActor.lookAt = a => event.bossActor.dir = CollisionBox.center(event.bossActor).x < a.x;
			event.bossActor.setAnimation('idle');
			event.bossActor.lookAt(CollisionBox.center(NNM.getPlayer()));
			event.bossActor.dir ^= 1;
		},
		timeline: [
			(game, event) => event.next = event.timelineFrame === 20 || !(game.scene.warning = shouldWarn()),
			warn('usada_pekora', 2, 'idle', null, 0, 210, {
				'40': event => {
					NNM.game.playBGM('crazy_bnuuy');
					event.bossActor.lookAt(CollisionBox.center(NNM.getPlayer()));
				},
				'140': event => event.bossActor.setAnimation('laugh'),
				'210': event => event.bossActor.setAnimation('idle')
			}),
			fight([Bullet, Rocket], true),
			(_, event) => {
				event.next = event.bossActor.canFall = true;
				event.bossActor.setAnimation('idle');
			}
		]
	},
	'Veiled Mori': calli(true),
	Miko: {
		setup: event => {
			event.bossActor = new Miko(new Vector2(archipelagoState.bossSpawnX, archipelagoState.arenaB - 32), 48);
			event.bossActor.lookAt = a => event.bossActor.dir = CollisionBox.center(event.bossActor).x < a.x;
			event.bossActor.setAnimation('idle');
			event.bossActor.lookAt(CollisionBox.center(NNM.getPlayer()));
		},
		timeline: [
			warn('sakura_miko', 3, 'sniper', 'elite_moonlight_scuffle', 0, 0, {
				'0': event => event.bossActor.setAnimation('sniper')
			}),
			fight([Bullet], true),
		]
	},
	Marine: {
		setup: event => {
			event.bossActor = new Marine(new Vector2(0, -Infinity), 96);
			event.bossActor.__archipelago_xl = archipelagoState.arenaL + 8;
			event.bossActor.__archipelago_xr = archipelagoState.arenaR - 24;
			event.bossActor.__archipelago_t = 0;
			event.bossActor.phase = 'intro';
			if (archipelagoState.arenaId === 18) {
				event.bossActor.__archipelago_xl += 40;
				event.bossActor.__archipelago_xr -= 40;
				archipelagoState.arenaB += 16;
			}
		},
		timeline: [
			warn('houshou_marine', 5, 'idle', 'cosplay_pirate_idol_frenzy', 0, 180, {
				'0': event => {
					event.bossActor.pos.y = NNM.game.scene.view.pos.y - 32;
					event.bossActor.vel.y = 0;
					if (NNM.getPlayer().pos.x < (archipelagoState.arenaL + archipelagoState.arenaR) / 2) {
						event.bossActor.__archipelago_t = 1;
						event.bossActor.dir = true;
					}
				}
			}),
			fight([Bullet, DokuroEnemy], true)
		]
	},
	Ayame: {
		setup: event => {
			event.bossActor = new Ayame(new Vector2(archipelagoState.bossSpawnX, archipelagoState.arenaB - 32), 48);
			event.bossActor.lookAt = a => event.bossActor.dir = CollisionBox.center(event.bossActor).x < a.x;
			event.bossActor.setAnimation('idle');
			event.bossActor.lookAt(CollisionBox.center(NNM.getPlayer()));
		},
		timeline: [
			warn('nakiri_ayame', 6, 'idle', 'elite_moonlight_scuffle'),
			roof,
			fight([Sword], true),
		]
	},
	Fubuki: {
		setup: event => {
			if (archipelagoState.bossSpawnX > archipelagoState.arenaTL && archipelagoState.bossSpawnX < archipelagoState.arenaTR - 16) {
				event.bossActor = new Fubuki(new Vector2(archipelagoState.bossSpawnX, Infinity), 64);
				event.bossActor.setAnimation('jump');
			} else {
				event.bossActor = new Fubuki(new Vector2(archipelagoState.bossSpawnX, archipelagoState.arenaB - 32), 64);
				event.bossActor.setAnimation('idle');
			}
			event.bossActor.lookAt = a => event.bossActor.dir = CollisionBox.center(event.bossActor).x < a.x;
			event.bossActor.lookAt(CollisionBox.center(NNM.getPlayer()));
		},
		timeline: [
			(_, event) => {
				if (event.bossActor.isGrounded) {
					event.bossActor.setAnimation('idle');
					event.next = true;
				}
				else if (event.bossActor.pos.y === Infinity){
					event.bossActor.pos.y = archipelagoState.arenaT - 64;
					event.bossActor.vel.y = 0;
				}
			},
			warn('shirakami_fubuki', 7, 'idle', 'dethroneworld', 30),
			fight([Bullet], true),
		]
	},
	Suisei: {
		setup: event => {
			const x = archipelagoState.arenaId === 4 ? 24 * 16 + 8 : (archipelagoState.arenaL + archipelagoState.arenaR) >> 1;
			event.bossActor = new Suisei(new Vector2(x - 8, -Infinity), 48, new Axe(new Vector2(x - 32, -Infinity)));
			NNM.game.scene.actors.push(event.bossActor.axe);
			event.bossActor.phase = 'intro';
		},
		timeline: [
			(game, event) => {
				game.scene.warning = shouldWarn();
				if (event.timelineFrame > 90) {
					game.scene.boss = event.bossActor;
					game.scene.bossText = new LocaleElem(game, 'hoshimachi_suisei');
					game.scene.boss.icon = 8;
					event.bossActor.pos.y = archipelagoState.arenaT - 6 * 16;
					event.bossActor.vel.y = 0;
					event.bossActor.axe.pos.y = archipelagoState.arenaT - 4 * 16;
					event.bossActor.axe.vel.y = 0;
					event.bossActor.phaseBuffer = -Infinity;
					event.next = true;
				}
			},
			(game, event) => {
				if (event.bossActor.axe.isGrounded) {
					NNM.getPlayer().playerControl = true;
					NNM.getPlayer().animationLocked = false;
					if (event.bossActor.phaseBuffer < 50)
						event.bossActor.phaseBuffer = 50;
				}

				if (event.bossActor.isGrounded) {
					event.next = true;
					game.scene.warning = false;
					game.playBGM('axe_dungeon_tatakae');
				}
			},
			fight([Comet, Axe], true)
		]
	},
	Polka: {
		setup: event => {
			event.bossActor = new Polka(new Vector2(archipelagoState.bossSpawnX, archipelagoState.arenaB - 32), 48);
			event.bossActor.lookAt = a => event.bossActor.dir = CollisionBox.center(event.bossActor).x < a.x;
			event.bossActor.setAnimation('idle');
			event.bossActor.lookAt(CollisionBox.center(NNM.getPlayer()));
			if (archipelagoState.arenaId) archipelagoState.arenaT = Math.max(archipelagoState.arenaT, 16 + NNM.game.scene.currentSection.pos.y);
		},
		timeline: [
			(game, event) => game.scene.actors.push(...(event.next = event.bossActor.cards)),
			warn('omaru_polka', 9, 'charge', 'polkata_fugue_tatakae'),
			(game, event) => game.playSound(event.next = 'charge'),
			fight([Bullet, Card], true)
		]
	},
	'Demon Lord Miko': {
		setup: event => {
			const x = archipelagoState.arenaId === 1 ? 1992 :
				[2, 4, 16, 21].includes(archipelagoState.arenaId) ? archipelagoState.bossSpawnX :
				(archipelagoState.arenaL + archipelagoState.arenaR) - 16 >> 1,
				y = archipelagoState.arenaB - 96,
				q = (archipelagoState.arenaR - archipelagoState.arenaL) >> 2;
			if (![4, 21, 23].includes(archipelagoState.arenaId)) NNM.game.scene.actors.push(new Throne(new Vector2(x - 40, archipelagoState.arenaB - 160)))
			event.bossActor = new EvilMiko(new Vector2(x,
				archipelagoState.arenaId === 4 ? 110 + Math.round(Math.cos(Math.floor(event.timelineFrame / 16) * (180 / Math.PI))) :
				archipelagoState.arenaId === 21 ? archipelagoState.arenaB - 36 :
				archipelagoState.arenaId === 23 ? archipelagoState.arenaB - 42 :
				archipelagoState.arenaB - 48), 64);
			event.bossActor.setAnimation(event.bossActor.phase = 'sit');
			event.bossActor.posTargets = [
				new Vector2(archipelagoState.arenaL - 8 + q, y),
				new Vector2(archipelagoState.arenaL - 8 + q * 2, y),
				new Vector2(archipelagoState.arenaL - 8 + q * 3, y)
			];
			if (archipelagoState.arenaId === 23) {
				archipelagoState.arenaT -= 12;
				const { background, foreground } = NNM.game.scene;
				for (let i = 68; i < 72; i++)
					background[`1${i}_9`] = '29';
				delete foreground['169_9'];
				delete foreground['170_9'];
			}
		},
		timeline: [
			warn('demon_lord_miko', 3, 'idle', 'elite_devil', 60, 120, {
				'60': event => {
					event.bossActor.setAnimation('evil');
					event.bossActor.phase = 'wait';
					event.bossActor.phaseBuffer = 0;
				},
				'120': event => {
					event.bossActor.dragonBreath = 60;
					if (archipelagoState.arenaId === 23) {
						const { background, foreground } = NNM.game.scene;
						foreground['169_9'] = foreground['170_9'] = '29';
						for (let i = 68; i < 72; i++)
							background[`1${i}_9`] = '1e';
					}
				}
			}),
			parallel(
				fight([Bullet, Block], true),
				(game, event) => game.currentQuest === 'random' && (event.bossActor.dragonBreath = Math.min(event.bossActor.dragonBreath, 80))
			)
		]
	},
	Flare: {
		setup: event => {
			event.bossActor = new EvilFlare(new Vector2(archipelagoState.bossSpawnX, archipelagoState.arenaB - 32), 64);
			event.bossActor.lookAt = a => event.bossActor.dir = CollisionBox.center(event.bossActor).x < a.x;
			event.bossActor.lookAt(NNM.getPlayer().pos);
			event.bossActor.dir ^= 1;
			event.bossActor.setAnimation('back');
			event.bossActor.phase = 'back';
		},
		timeline: [
			warn('shiranui_flare', 0, 'idle', null, 30, 0, {
				'0': event => {
					event.bossActor.lookAt(NNM.getPlayer().pos);
					event.bossActor.setAnimation('idle');
				},
				'30': event => {
					event.bossActor.setAnimation('chant');
					event.bossActor.lastPhase = 'back';
					NNM.game.bgmFadeOut = false;
					NNM.game.playBGM('serious_&_go');
				}
			}),
			(_, event) => event.next = !event.bossActor.setAnimation('idle'),
			fight([IceShield, Bullet], true),
		]
	},
	Demon: {
		setup: event => {
			if (archipelagoState.arenaId === 18)
				archipelagoState.arenaB += 16;
			event.helper = new ShirakenHelper(new Vector2((archipelagoState.arenaL + archipelagoState.arenaR) / 2, archipelagoState.arenaB - 32), 'noel', NNM.getPlayer().pos.x > (archipelagoState.arenaL + archipelagoState.arenaR) / 2);
			event.helper.pos.x += archipelagoState.arenaId === 18 ? -120 : event.helper.dir ? -72 : 56;
			NNM.game.scene.actors.unshift(event.helper);
		},
		timeline: [
			(game, event) => {
				if (!game.scene.newSectionBuffer && (!game.scene.lockedViewPos || game.scene.lockedViewPos.x === game.scene.view.pos.x)) {
					event.bossActor = event.helper.demon = new Demon(game.scene.view.pos.plus({ x: 128, y: 192 }), 96);
					event.next = event.bossActor.phase = 'intro';
					event.bossActor.__archipelagoLaserBottom = archipelagoState.arenaId === 18 ? 192 : archipelagoState.arenaB;
					game.scene.actors.splice(game.scene.actors.indexOf(event.helper) + 1, 0, event.bossActor);
					game.scene.warning = shouldWarn();
					game.bgmFadeOut = false;
					game.playBGM('unlimited');
				}
			},
			warn('unknown', 1, 'idle', null, 336, 0, {
				'337': event => {
					NNM.game.scene.warning = NNM.getPlayer().animationLocked = !(NNM.getPlayer().playerControl = event.helper.chargeEnabled = true);
					if (archipelagoState.arenaId === 18) {
						for (const hand of event.bossActor.hands) {
							const checkHit = hand.checkHit;
							hand.checkHit = (game, cb) => cb.type !== 'mace2' && checkHit(game, cb);
						}
					}
				}
			}),
			fight([Bullet]),
			(_, event) => {
				event.bossActor.targetPos.y -= event.next = 128;
				event.helper.chargeBuffer = 0;
			}
		]
	},
	Kiara: {
		setup: event => {
			//NNM.game.scene.actors.push(new KiaraFire(
			event.bossActor = new Kiara(new Vector2(archipelagoState.bossSpawnX, archipelagoState.arenaB - 32), 64)
			//));
			event.bossActor.lookAt = a => event.bossActor.dir = CollisionBox.center(event.bossActor).x < a.x;
			event.bossActor.lookAt(NNM.getPlayer().pos);
			event.bossActor.setAnimation('idle');
		},
		timeline: [
			warn('takanashi_kiara', 1, 'idle', null, 60, 0, {
				'0': event => {
					event.bossActor.setAnimation('charge');
					NNM.game.bgmFadeOut = false;
					NNM.game.playBGM('kiara');
					NNM.game.scene.warning = shouldWarn();
				},
				'15': event => event.bossActor.setAnimation('idle'),
				'30': event => event.bossActor.setAnimation('charge'),
				'60': event => event.bossActor.setAnimation('idle'),
			}),
			fight([Bullet], true)
		]
	},
	Mori: calli(false),
	Gura: {
		setup: event => {
			event.bossActor = new Gura(new Vector2(-1e5, 16 + (archipelagoState.guraY = Math.max(archipelagoState.arenaT + 16, archipelagoState.arenaB - 144))), 64);
			event.bossActor.checkHit = (_, cb) => !(cb instanceof Aircon) && CollisionBox.intersects(event.bossActor, cb);
			event.bossActor.phase = 'move';
			event.bossActor.phaseBuffer = -Infinity;
			event.bossActor.intro = true;
		},
		timeline: [
			(game, event) => event.next = !game.scene.newSectionBuffer && (!game.scene.lockedViewPos || game.scene.lockedViewPos.x === game.scene.view.pos.x),
			warn('gawr_gura', 1, 'idle', null, 30, 180, {
				'0': event => {
					NNM.game.bgmFadeOut = false;
					NNM.game.playBGM('gura');
					NNM.game.scene.warning = shouldWarn();
					if (NNM.getPlayer().pos.x < archipelagoState.bossSpawnX) {
						event.bossActor.pos.x = NNM.game.scene.view.pos.x - 32;
						event.bossActor.vel.x = 3;
						event.bossActor.targetSide = true;
					} else {
						event.bossActor.pos.x = NNM.game.scene.view.pos.x + 336;
						event.bossActor.vel.x = -3;
						event.bossActor.targetSide = false;
					}
					archipelagoState.guraLeft = archipelagoState.arenaL + 48*!!CollisionBox.intersectCollisions({ pos: {x: archipelagoState.arenaL - 1, y: archipelagoState.guraY}, size: {x: 1, y: 64} }, NNM.game.scene.currentSection.collisions).length;
					archipelagoState.guraRight = archipelagoState.arenaR - 16 - 48*!!CollisionBox.intersectCollisions({ pos: {x: archipelagoState.arenaR, y: archipelagoState.guraY}, size: {x: 1, y: 64} }, NNM.game.scene.currentSection.collisions).length;
					if (archipelagoState.arenaId === 4) {
						event.bossActor.attack2Phase = _ => (
							event.bossActor.phase = 'attack3',
							event.bossActor.lastMove = ''
						);
					}
				},
				'180': event => {
					event.bossActor.intro = false;
					archipelagoState.guraLeft = archipelagoState.arenaL + 16*!!CollisionBox.intersectCollisions({ pos: {x: archipelagoState.arenaL - 1, y: archipelagoState.guraY}, size: {x: 1, y: 64} }, NNM.game.scene.currentSection.collisions).length;
					archipelagoState.guraRight = archipelagoState.arenaR - 16 - 16*!!CollisionBox.intersectCollisions({ pos: {x: archipelagoState.arenaR, y: archipelagoState.guraY}, size: {x: 1, y: 64} }, NNM.game.scene.currentSection.collisions).length;
				}
			}),
			fight([Bullet], true),
		]
	},
	Ina: {
		setup: _ => ['castle', 'holo_hq'].includes(NNM.game.currentStage) && (NNM.game.scene.background = NNM.game.scene.foreground, NNM.game.scene.foreground = {}),
		timeline: [
			warn('ninomae_inanis', 1, 'idle', null, 30, 0, {
				'0': event => {
					NNM.game.playBGM('ina');
					event.bossActor = new Ina(new Vector2(archipelagoState.arenaL + ({ heaven: 40, falls: 72 }[NNM.game.currentStage] || -64), NNM.game.scene.currentSection.pos.y + NNM.game.scene.currentSection.size.y), 64);
					event.bossActor.posTarget = event.bossActor.pos.plus({ x: 0, y: -5 * 16 });
					event.bossActor.setAnimation('idle');
					event.bossActor.dir = true;
					NNM.game.scene.actors.push(event.bossActor);
					for (const [x, y] of [
						[-40, 8],
						[-24, 0],
						[0, 16],
						[8, 16],
						[24, 0],
						[40, 8]
					]) {
						const tentacle = new Tentacle(event.bossActor.pos.plus({x, y}));
						tentacle.posTarget = tentacle.pos.plus({ x: 0, y: -64 });
						NNM.game.scene.actors.push(tentacle);
					}
				},
				'30': event => {
					if (!['castle', 'holo_hq'].includes(NNM.game.currentStage)) {
						const tilesToDestroy = archipelagoState.arenaId === 18 ? 5 : 10;
						for (const c of event.destroyedInaCol = NNM.game.scene.currentSection.collisions.filter(c => c.size.y === 16 && c.pos.x < NNM.game.scene.currentSection.pos.x + tilesToDestroy * 16))
							c.pos.y += 64;
						event.destroyedInaTiles = {};
						for (let i = 0; i <= tilesToDestroy; i++) {
							for (let j = 10 - (i < tilesToDestroy); j < 11; j++) {
								const k = `${i + NNM.game.scene.currentSection.pos.x / 16}_${j + NNM.game.scene.currentSection.pos.y / 16}`;
								event.destroyedInaTiles[k] = NNM.game.scene.foreground[k];
								delete NNM.game.scene.foreground[k];
								if (NNM.game.scene.background[k] == 3)
									NNM.game.scene.background[k] = '1';
							}
						}
						NNM.game.playSound('explosion');
						if (archipelagoState.arenaId === 18) {
							for (let x = 2564; x < 2621; x += 2) {
								NNM.game.scene.particles.smoke_white(new Vector2(x, 164), Vector2.zero, 0);
								NNM.game.scene.particles.smoke_white(new Vector2(x, 168), Vector2.zero, 0);
								NNM.game.scene.particles.smoke_white(new Vector2(x, 170), Vector2.zero, 0);
								NNM.game.scene.particles.smoke_white(new Vector2(x, 172), Vector2.zero, 0);
							}
						} else {
							NNM.game.scene.actors.push(new BridgeLip());
							for (let x = 1928; x < 2080; x += 16) {
								NNM.game.scene.particles.explosion(new Vector2(x, archipelagoState.arenaB), 0);
							}
						}
					}
				}
			}),
			fight([Bullet, Tentacle], true, true),
			(game, event) => {
				event.next = true;
				if (event.destroyedInaCol) {
					for (const c of event.destroyedInaCol)
						c.pos.y -= 64;
					for (const k in event.destroyedInaTiles)
						game.scene.foreground[k] = event.destroyedInaTiles[k];
				} else game.scene.foreground = game.scene.background;
			}
		]
	},
	Ame: {
		setup: event => {
			event.bossActor = new Ame(new Vector2(archipelagoState.bossSpawnX, archipelagoState.arenaB - 32), 64);
			event.bossActor.checkHit = (_, cb) => !(cb instanceof Aircon) && CollisionBox.intersects(event.bossActor, cb);
			event.bossActor.setAnimation(NNM.game.scene.ameReset ? 'smug' : 'intro');
			event.bossActor.lookAt = a => event.bossActor.dir = CollisionBox.center(event.bossActor).x < a.x;
			event.bossActor.lookAt(NNM.getPlayer().pos);
			event.bossActor.dir ^= 1;
		},
		timeline: [
			warn('watson_amelia', 1, 'idle', null, 120, 0, {
				'0': event => {
					NNM.game.bgmFadeOut = false;
					NNM.game.playBGM('amelia');
					NNM.game.scene.warning = shouldWarn();
					if (!NNM.game.scene.ameReset) {
						event.bossActor.lookAt(NNM.getPlayer().pos);
						event.bossActor.setAnimation('look');
					}
				},
				'60': event => {
					event.bossActor.dir ^= !NNM.game.scene.ameReset;
					const player = NNM.getPlayer();
					archipelagoState.ameResetData = {
						pos: player.pos.value(),
						dir: player.dir,
						fx: new AmeSpiral()
					};
				}
			}),
			fight([Bullet], true),
			(game, event) => game.scene.isAmeFocus = game.scene.ameReset = archipelagoState.ameResetData = !(event.next = true)
		]
	},
	Kanata: {
		setup: event => {
			event.bossActor = new Kanata(new Vector2(Infinity, Infinity), 64);
			event.bossActor.checkHit = (_, cb) => !(cb instanceof Aircon) && CollisionBox.intersects(event.bossActor, cb);
			event.bossActor.phase = 'move';
			event.bossActor.intro = true;
		},
		timeline: [
			warn('amane_kanata', 1, 'idle', 'kiseki', 30, 180, {
				'0': event => {
					event.bossActor.targetSide = NNM.getPlayer().pos.x < (archipelagoState.arenaL + archipelagoState.arenaR) / 2;
					event.bossActor.pos = new Vector2(event.bossActor.targetSide ? archipelagoState.arenaR - 9 * 16 : archipelagoState.arenaL + 8 * 16, NNM.game.scene.currentSection.pos.y - 64);
					event.bossActor.vel = new Vector2(event.bossActor.targetSide ? 3 : -3, 2);
				},
				'180': event => event.bossActor.intro = false
			}),
			fight([Bullet], true, true),
		]
	},
	Coco: {
		timeline: [
			(game, event) => {
				if (!game.scene.newSectionBuffer && (!game.scene.lockedViewPos || game.scene.lockedViewPos.x === game.scene.view.pos.x)) {
					event.bossActor = new Dragon(game.scene.view.pos.plus({ x: 128, y: 128 }), 64);
					event.next = event.bossActor.phase = 'intro';
					event.bossActor.__archipelagoLaserBottom = [16, 18].includes(archipelagoState.arenaId) ? game.scene.view.pos.y + 192 : archipelagoState.arenaB;
					game.scene.actors.unshift(event.bossActor);
					NNM.game.playSound('charge2');
					NNM.game.scene.warning = shouldWarn();
				}
			},
			warn(null, 1, 'idle', 'kiseki', 208, 0, {
				'59': _ => NNM.game.playSound('charge2'),
				'119': _ => NNM.game.playSound('charge2'),
				'179': _ => NNM.game.playSound('charge2'),
				'209': _ => NNM.game.scene.warning = !(NNM.getPlayer().playerControl = true),
			}),
			fight([Bullet]),
		],
	},
	Towa: {
		setup: event => {
			event.bossActor = new Bibi(new Vector2(archipelagoState.bossSpawnX, Infinity), 48);
			event.bossActor.toFilter = true;
			if (!NNM.game.scene.actors.some(a => a instanceof TowaOpen) && archipelagoState.arenaId !== 6)
				NNM.game.scene.actors.push(new TowaOpen());
		},
		timeline: [
			(game, event) => {
				if (!event.timelineFrame) {
					game.bgmFadeOut = false;
					game.playBGM('unlimited');
					event.introEffect = 8;
					event.introEffectOffset = event.introEffectFade = 0;
					if (archipelagoState.arenaId === 6)
						NNM.game.scene.actors.push(new TowaOpen());
				}

				game.scene.customDraw.push(game => {
					const cx = game.ctx2;
					cx.save();
					cx.translate(-game.scene.view.pos.x, -game.scene.view.pos.y);
					cx.translate(event.bossActor.pos.x + 8, archipelagoState.arenaB - 128 + 16 * (8 - event.introEffect) + event.introEffectOffset);
					if (event.bossActor.pos.x > NNM.getPlayer().pos.x)
						cx.scale(-1, 1);
					cx.translate(-16, 0);
					cx.globalAlpha = event.introEffectFade ? 1 - Math.min(1, event.introEffectFade / 100) : 1;
					cx.drawImage(game.assets.images.sp_towa_hair, 0, 0, 48, 48, -32, -48, 48, 48);
					cx.drawImage(game.assets.images.sp_towa_idle, 0, 0, 48, 48, -32, -48, 48, 48);
					cx.drawImage(game.assets.images.sp_bibi, Math.floor(event.timelineFrame / 16) % 2 * 24, 0, 24, 16, 2, -16, 24, 16);
					cx.restore();
				});

				if (event.introEffect) {
					event.introEffectOffset += 8;
					if (event.introEffectOffset > event.introEffect * 16) {
						event.introEffectOffset = 0;
						event.introEffect--;
					}
				} else if (++event.introEffectFade > 99 && !event.warnStarted) {
					event.next = true;
				} else if (event.bossActor.toFilter) {
					event.bossActor.toFilter = false;
					event.bossActor.pos.y = archipelagoState.arenaB - 16;
					event.bossActor.vel = Vector2.zero;
					game.scene.actors.push(event.bossActor);
					warn('bibi', 1)(game, event);
					NNM.getPlayer().playerControl = true;
				} else if (event.bossActor.canDie) {
					game.scene.warning = event.warnStarted = false;
				}
			},
			roof,
			fight([BibiFire]),
			(game, event) => {
				if (event.timelineFrame === 180) {
					event.next = game.scene.boss = event.bossActor;
					game.scene.bossText = new LocaleElem(game, 'tokoyami_towa');
					NNM.getPlayer().dir = event.bossActor.pos.x > NNM.getPlayer().pos.x;
				} else if (!event.timelineFrame) {
					event.bossActor = new Towa(new Vector2(game.scene.view.pos.x + 160 - 8, archipelagoState.arenaT - 16), 96)
					while (!CollisionBox.intersectCollisions(event.bossActor, game.scene.currentSection.collisions).length)
						event.bossActor.pos.y -= 16;
					event.bossActor.pos.y += 16;
					event.bossActor.icon = 1;
					event.bossActor.phase = 'intro';
					event.bossActor.isUpsideDown = true;
					event.bossActor.setAnimation('crouch');
					game.scene.actors.unshift(event.bossActor);
				}
			},
			fight([Bibi, BibiFire, Bullet], true)
		]
	},
	Robot: {
		setup: event => {
			event.bossActor = new RobotBoss(new Vector2(archipelagoState.bossSpawnX, archipelagoState.arenaB - 32), 32);
			event.bossActor.frameCount = 120;
			event.bossActor.lookAt(CollisionBox.center(NNM.getPlayer()));

			if (archipelagoState.arenaId === 16) {
				event.bossActor.__archipelagoTargets = [
					new Vector2(archipelagoState.arenaR - 160, archipelagoState.arenaB - 32),
					new Vector2(archipelagoState.arenaR - 32, archipelagoState.arenaB - 32)
				];
			} else if (archipelagoState.arenaId === 23) {
				event.bossActor.__archipelagoTargets = [
					new Vector2(archipelagoState.arenaL + 4, archipelagoState.arenaB - 48),
					new Vector2(archipelagoState.arenaR - archipelagoState.bossSpawnX + archipelagoState.arenaL - 16, archipelagoState.arenaB - 32),
					new Vector2((archipelagoState.arenaL + archipelagoState.arenaR - 16) >> 1, archipelagoState.arenaB - 48),
					new Vector2(archipelagoState.bossSpawnX, archipelagoState.arenaB - 32),
					new Vector2(archipelagoState.arenaR - 20, archipelagoState.arenaB - 48)
				];
			} else if (archipelagoState.arenaId !== 21) {
				event.bossActor.__archipelagoTargets = [
					new Vector2(archipelagoState.arenaL + 16, archipelagoState.arenaB - 32),
					new Vector2((archipelagoState.arenaL + archipelagoState.arenaR - 16) >> 1, archipelagoState.arenaB - 32),
					new Vector2(archipelagoState.arenaR - 32, archipelagoState.arenaB - 32)
				];
			}
		},
		timeline: [
			warn(null, 12, 'attack', 'robotic_foe'),
			fight()
		]
	},
	Chloe: {
		setup: event => NNM.game.scene.actors.unshift(event.chloe = new Chloe()),
		timeline: [
			(game, event) => event.chloe.event(game, event)
		]
	},
	Lui: {
		setup: event => {
			event.bossActor = new Lui(new Vector2(archipelagoState.bossSpawnX, archipelagoState.arenaB - 32), 64);
			event.bossActor.lookAt(NNM.getPlayer().pos);
			event.bossActor.animation = 'cool';
		},
		timeline: [
			warn('takane_lui', 14, 'idle', 'dummy_th000', 30),
			fight()
		]
	},
	Iroha: {
		setup: event => {
			event.bossActor = new Iroha(new Vector2(archipelagoState.bossSpawnX, archipelagoState.arenaB - 32), 48);
			event.bossActor.lookAt(NNM.getPlayer().pos);
			event.bossActor.animation = 'think';
		},
		timeline: [
			warn('kazama_iroha', 11, 'idle', 'crazy_bnuuy'),
			fight()
		]
	},
	'La+': {
		setup: event => {
			event.bossActor = new Laplus(new Vector2(archipelagoState.bossSpawnX, NNM.game.scene.currentSection.pos.y - 64), 64);
			event.bossActor.checkHit = (_, cb) => !(cb instanceof Aircon) && CollisionBox.intersects(event.bossActor, cb);
			event.bossActor.__archipelagoLaserBottom = [16, 18].includes(archipelagoState.arenaId) ? NNM.game.scene.view.pos.y + 192 : archipelagoState.arenaB;
			event.bossActor.setAnimation('idle');
			const above = { pos: { x: NNM.game.scene.currentSection.pos.x, y: NNM.game.scene.currentSection.pos.y - NNM.game.height }, size: NNM.game.scene.view.size };
			event.canPanUp = archipelagoState.arenaId && !CollisionBox.intersectCollisions(above, NNM.game.scene.sections).length && ![...Object.keys(NNM.game.scene.foreground), ...Object.keys(NNM.game.scene.background)].some(key => {
				const [sx, sy] = key.split('_');
				const x = sx * 16, y = sy * 16;
				return y === NNM.game.scene.currentSection.pos.y && x >= NNM.game.scene.currentSection.pos.x && x < NNM.game.scene.currentSection.pos.x + NNM.game.scene.currentSection.size.x;
			});
		},
		timeline: [
			(game, event) => {
				event.next = !event.canPanUp;
				if (event.timelineFrame > 60) {
					game.scene.lockedViewPos = game.scene.view.pos.plus({ x: 0, y: -10 * 12 });
					event.next = true;
				}
			},
			parallel(warn('laplus_darknesss', 15, 'idle', 'elite_devil', 0, 188), (game, event) => {
				event.bossActor.pos.y = Math.max(event.bossActor.pos.y, lerp(event.bossActor.pos.y, (event.canPanUp ? game.scene.lockedViewPos : game.scene.view.pos).y + 64, .1));
				if (event.bossActor.canDie) {
					if (event.canPanUp) game.scene.lockedViewPos.y = lerp(game.scene.lockedViewPos.y, game.scene.currentSection.pos.y, .08);
					else event.timelineFrame += 60;
				}
			}),
			(game, event) => event.next = !event.canPanUp || delete game.scene.lockedViewPos,
			fight([Bullet], true, true)
		]
	},
	Koyodrill: {
		timeline: [
			(game, event) => {
				event.next = event.bossActor = new Koyodrill(new Vector2(archipelagoState.bossSpawnX, Math.max(archipelagoState.arenaB, NNM.game.scene.currentSection.pos.y + 192) + 32), archipelagoState.arenaId === 4 ? 32 : 96);
				event.bossActor.angle = Math.PI / -2;
				event.bossActor.targetPos = new Vector2(event.bossActor.pos.x + 8, Math.max(archipelagoState.arenaB - 6 * 16, archipelagoState.arenaT + 48));
				event.bossActor.checkHit = (_, cb) => !(cb instanceof Aircon) && event.bossActor.phase !== 'defeated' && CollisionBox.intersects(event.bossActor, cb);
				event.bossActor.blackoutObject = true;
				game.scene.actors.push(event.bossActor);
				for (let i = 0; i < 12; i++) {
					const bodyPart = new KoyodrillBody(event.bossActor.pos.plus(new Vector2(0, 16 * (i + 1))), event.bossActor);
					bodyPart.checkHit = (_, cb) => !(cb instanceof Aircon) && event.bossActor.phase !== 'defeated' && CollisionBox.intersects(bodyPart, cb);
					event.bossActor.bodyParts.push(bodyPart);
					game.scene.actors.push(bodyPart);
				}
				const bridge = game.scene.actors.find(a => a instanceof Bridge);
				if (bridge) {
					const old = event.bossActor.update;
					event.bossActor.update = game => {
						old(game);
						bridge.destroy(game, event.bossActor);
					};
				}
			},
			warn('koyodrill', 12, 'idle', 'robotic_foe', 120),
			parallel(fight(null, false, true), game => {
				if (game.currentQuest !== 'random') {
					for (const a of game.scene.actors)
						if (a instanceof Crystal && a.duration > 60)
							a.duration = 60;
				}
			})
		]
	}
};

function bossTL(boss, intro, introPre, introPost) {
	const data = bosses[boss];
	return [...(introPre || []), (game, event) => {
		intro(event);
		if (event.timelineFrame) return;
		if (data.setup) data.setup(event);
		if (event.bossActor) {
			game.scene.actors.push(event.bossActor);
			event.bossActor.blackoutObject = true;
		}
	}, ...(introPost || []), ...data.timeline];
}

export function patchBosses() {
	let quest_start;
	for (let i = 0; i < arenas.length; i++) {
		const { quest, event, skip, bounds, final, bossSpawnX, endingFrames, walkTo, collision, introPre, introPost, outroPre, playerControl, floorData } = arenas[i];
		if (arenas[i - 1]?.quest !== quest)
			quest_start = i;
		const id = i;
		const index = i - quest_start;
		const feat = quest === 'nnq' && Feat.NNQ_BOSS_DEFEAT + i;
		if (!event) continue;
		const intro = arenas[i].intro || (event => {
			if (self.archipelagoState.arenaWalkTo) {
				const wtx = Math.abs(self.archipelagoState.arenaWalkTo);
				if (Math.sign(NNM.getPlayer().pos.x - wtx) === Math.sign(self.archipelagoState.arenaWalkTo)) {
					NNM.game.resetCpuKeys();
				} else {
					NNM.game.cpuKeys[walkTo < 0 ? 'left' : 'right'] = true;
					return;
				}
			}
			if (collision instanceof Array) {
				event.collisions = collision;
				NNM.game.scene.currentSection.collisions.push(...collision);
			} else if (collision) {
				event.collision = collision;
				NNM.game.scene.currentSection.collisions.push(collision);
			}
			event.next = true;
		});
		const oldInitialFrame = event.timeline[0];
		event.timeline[0] = (game, ge) => {
			if (self.archipelagoState && !ge.timelineFrame) {
				const boss = self.archipelagoState.slotData.boss[quest][index];
				self.archipelagoState.arenaL = bounds.x;
				self.archipelagoState.arenaT = bounds.y;
				self.archipelagoState.arenaR = bounds.x + bounds.w;
				self.archipelagoState.arenaB = bounds.y + bounds.h;
				[self.archipelagoState.arenaTL, self.archipelagoState.arenaTR] =
					bounds.t === 'arena' ? [bounds.x, self.archipelagoState.arenaR] :
					bounds.t === 'section' ? [game.scene.currentSection.pos.x, game.scene.currentSection.pos.x + game.scene.currentSection.size.x] :
					(bounds.t || [0, 0]);
				self.archipelagoState.arenaId = id;
				self.archipelagoState.bossId = boss;
				self.archipelagoState.arenaFinal = final;
				self.archipelagoState.arenaWalkTo = walkTo;
				self.archipelagoState.bossSpawnX = bossSpawnX || bounds.x + (bounds.w >> 1) - 8;
				self.archipelagoState.scout((4 << 16) | id);
				if (boss !== skip) {
					game.resetCpuKeys();
					if (!playerControl) {
						NNM.getPlayer().playerControl = false;
						if (game.quest === 'random') NNM.getPlayer().chargeShotBuffer = 0;
						game.scene.isFocus = 0;
						if (id !== 4 && !(archipelagoState.bgmId === 'kiseki' && ['Kanata', 'Coco'].includes(boss)) && !(archipelagoState.bgmId === 'play_dice' && boss === 'Chloe'))
							game.stopBGM();
					}
					if (floorData) game.scene.actors.push(new DynamicFloor(ge, floorData));
					const newTL = bossTL(boss, intro, introPre, introPost);
					if (feat) newTL.push((_, event) => self.archipelagoState.save(event.next = !self.archipelagoState.feat(feat)));
					if (outroPre)
						newTL.push(...outroPre);
					for (let f = endingFrames??1; f > 0; f--)
						newTL.push(ge.timeline[ge.timeline.length - f]);
					ge.timeline = newTL;
					return newTL[0](game, ge);
				}
			}
			oldInitialFrame(game, ge);
		};
	}
}
