import { needsRoof } from './boss.js';

function noSun(game) {
	game.scene.sun = false;
}

function noRain(game) {
	game.scene.rain = false;
}

function rmInaWater(game) {
	if (game.currentStage === 'holo_hq' && game.scene.currentSection.pos.x === 640 && game.scene.background['40_22']) {
		for (let i = 40; i < 60; i++) {
			delete game.scene.background[i + '_22'];
			delete game.scene.background[i + '_23'];
			delete game.scene.foreground[i + '_23'];
		}
	}
}

function processWaterData(data) {
	data.ts = NNM.game.assets.images[data.alt ? 'ts_port_alt' : 'ts_port'];
}

function water(data) {
	processWaterData(data);
	return _ => archipelagoState.water = data;
}

function caveWater(game, cx) {
	if (game.currentQuest === 'nuinui' && (game.currentStage === 'port' || (game.currentStage === 'holo_hq' && game.scene.currentSection.pos.x === 640)))
		cx.drawImage(game.assets.images.NNM_Archipelago_cave, 0, 145);
}

function drawPortWater(y = 140) {
	return (game, cx) => {
		if (game.currentQuest === 'nuinui' && game.currentStage === 'port') {
			cx.save();
			if (archipelagoState.water?.filter) cx.filter = archipelagoState.water.filter;
			cx.fillStyle = (archipelagoState.water?.alt ?? game.scene.isAltColor) ? '#00007f' : '#5f7fff';
			cx.fillRect(0, y, 320, 52);
			cx.restore();
		}
	};
}

function drawPortWaterWithReflection(game, cx) {
	if (game.currentQuest === 'nuinui' && game.currentStage === 'port') {
		cx.save();
		if (archipelagoState.water?.filter) cx.filter = archipelagoState.water.filter;
		cx.fillStyle = (archipelagoState.water?.alt ?? game.scene.isAltColor) ? '#00007f' : '#5f7fff';
		cx.fillRect(0, 140, 320, 52);
		cx.restore();

		for (let i = 0; i < 20; i++) {
			cx.globalAlpha = .5 - i / 40;
			const o = Math.round(Math.sin((game.scene.frameCount + i * 4) * .02));
			cx.drawImage(cx.canvas, 0, 139 - i, 320, 1, o, 140 + i, 320, 1);
			if (o < 0) cx.drawImage(cx.canvas, 320 + o, 139 - i, -o, 1, 320 + o, 140 + i, -o, 1);
			else if (o) cx.drawImage(cx.canvas, 0, 139 - i, o, 1, 0, 140 + i, o, 1);
		}

		cx.globalAlpha = 1;
	}
}

function layerImage(name, y=0) {
	const img = NNM.game.assets.images['bg_' + name];
	return (game, cx) => cx.drawImage(img, 0, y, 320, 192, 0, 0, 320, 192);
}

function portScroll(alt) {
	const psData = {
		i0: NNM.game.assets.images[alt ? 'bg_port_scroll_alt' : 'bg_port_scroll'],
		i1: NNM.game.assets.images[alt ? 'bg_port_scroll_alt2' : 'bg_port_scroll2'],
	};
	return _ => archipelagoState.portScroll = psData;
}

function heavenForeground(alt) {
	const img = NNM.game.assets.images[alt ? 'bg_heaven_alt2' : 'bg_heaven2'];
	return (game, cx) => cx.drawImage(img, 0, -Math.round(1 + Math.sin(game.scene.frameCount * 0.0349)));
}

function wave(name, freq, amp, alpha) {
	return (game, cx) => {
		const img = name ? game.assets.images[name] : cx.canvas;
		cx.globalAlpha = alpha;
		for (let i = 0; i < 192; i++)
			cx.drawImage(img, 0, i, 320, 1, -Math.round(amp * (+!!name + Math.sin((game.scene.frameCount + i) * freq))), i, 320, 1);
		cx.globalAlpha = 1;
	};
}

const castleWave = [
	wave('bg_castle2', .07, 2, .75),
	wave('bg_castle_alt2', .07, 2, .75),
	wave(null, .07, 2, .75)
];

class Background {
	#layers;
	#water;
	other = this;

	constructor(baseName, layers, alt) {
		this.baseName = baseName;
		this.#layers = layers;
		if ((this.alt = alt) + 1) processWaterData(this.#water = {alt});
	}

	draw(game, cx) {
		archipelagoState.portScroll = null;
		archipelagoState.water = this.#water;
		for (const layer of this.#layers)
			layer(game, cx);
		if (game.scene.skyTransistion && this.baseName !== 'water')
			castleWave[this.baseName === 'castle' ? +this.alt : 2](game, cx);

		if (self.water) {
			if (!self.water._P) {
				processWaterData(self.water);
				self.water._P = 1;
			}
			archipelagoState.water = self.water;
		}
	}
}

function pair(a, b) {
	return [a.other = b, b.other = a];
}

const map = {}, altMap = {}, stageAreas = {
	nuinui: {
		holo_hq: ['holo_hq', 'kiara', 'mori', 'water', 'ina']
	},
	random: {
		port: ['port', 'water']
	},
	maiden: {
		'boat-0': []
	}
};

export function randomiseBGs(seed, mode) {
	for (const quest in stageAreas) {
		for (const stage in NNM.game.quests[quest].stages) {
			stageAreas[quest][stage] ??= [stage];
		}
	}
	
	const rng = seed ? createLCG(seed) : random;

	if (mode) {

	} else {
		let boat = '', flag;
		for (const line of NNM.code.filesMatching('scene.js')[0].lines) {
			if (line.scope?.startsWith('Scene.drawBackground')) {
				if (flag) {
					if (line.code.trim() === 'return;') break;
					else boat += line.code.replace(/this\.frameCount/g,
						'(game.scene.frameCount * (game.currentQuest === "nuinui" && game.currentStage === "port" && (game.scene.lockedViewPos || (!game.scene.currentSection.pos.y && game.scene.currentSection.pos.x === 320)) ? -.5 : 1))') + '\n';
				} else if (line.code.includes("=== 'boat'")) flag = true;
			}
		}
		const pool = [
			new Background('boat', [new Function('game', 'cx', boat), noSun, rmInaWater, water({no: 1})]),
			...pair(
				new Background('falls', [layerImage('falls'), water({filter: 'brightness(.8) contrast(1.3) hue-rotate(-25deg)'}), drawPortWater()], false),
				new Background('falls', [layerImage('falls_alt'), noSun, water({alt: 1, filter: 'hue-rotate(15deg)'}), drawPortWater()], true)
			),
			...pair(
				new Background('casino', [layerImage('casino'), water({filter: 'grayscale(.2) brightness(.6)'}), drawPortWater()], false),
				new Background('casino', [layerImage('casino_alt'), noSun, water({filter: 'grayscale(.4) hue-rotate(-50deg)'}), drawPortWater()], true)
			),
			...pair(
				new Background('port', [layerImage('port'), portScroll(false)], false),
				new Background('port', [layerImage('port_alt'), portScroll(true), noSun], true)
			),
			...pair(
				new Background('yamato', [layerImage('yamato'), water({alt: 1, filter: 'hue-rotate(132deg)'}), drawPortWater(158)], false),
				new Background('yamato', [layerImage('yamato_alt'), noSun, water({alt: 1, filter: 'hue-rotate(10deg) grayscale(.7)'}), drawPortWater(154)], true)
			),
			...pair(
				new Background('castle', [layerImage('castle'), noSun, noRain, rmInaWater, drawPortWaterWithReflection], false),
				new Background('castle', [layerImage('castle_alt'), noSun, noRain, rmInaWater, drawPortWaterWithReflection], true)
			),
			...pair(
				new Background('holo_hq', [layerImage('holo_hq'), rmInaWater, drawPortWater(149)], false),
				new Background('holo_hq', [layerImage('holo_hq_alt'), noSun, rmInaWater, drawPortWater(149)], true)
			),
			...pair(
				new Background('heaven', [layerImage('heaven'), heavenForeground(false), drawPortWater(157)], false),
				new Background('heaven', [layerImage('heaven_alt'), heavenForeground(true), water({filter: 'grayscale(.3) brightness(.6) hue-rotate(230deg)'}), drawPortWater(157)], true)
			),
			new Background('mori', [layerImage('calli'), caveWater, water({alt: 1, filter: 'contrast(2) grayscale(.2) brightness(.8) hue-rotate(9deg)'})]),
			new Background('kiara', [layerImage('kiara'), noSun, noRain, water({filter: 'brightness(.7) contrast(1.2)'})]),
			new Background('water', [wave('bg_gura', .008727, 4), layerImage('gura', 192), noRain, rmInaWater]),
			new Background('hub', [(game, cx) => game.scene.drawHubBackground(game, cx, game.arcadeBg = 1), noSun, noRain])
		];
		for (const quest in stageAreas) {
			map[quest] = {};
			let cPool = pool, baseName, rPool;
			for (const area of Object.values(stageAreas[quest]).flat()) {
				do rPool = (
					area === 'kiara' && needsRoof(archipelagoState.slotData.boss.nnq?.[13]) ? cPool.filter(bg => ['kiara', 'hub'].includes(bg.baseName)) :
					area === 'port' && quest === 'nuinui' ? cPool.filter(bg => !['kiara', 'water'].includes(bg.baseName)) :
					['water', 'ina', 'kiara', 'mori'].includes(area) && quest === 'nuinui' ? cPool :
					cPool.filter(bg => bg.baseName !== 'kiara')
				);
				while (!rPool.length && (cPool = pool));
				const baseName = (map[quest][area] = rPool[0|(rng() * rPool.length)]).baseName;
				if (!['boat-3', 'castle-2', 'falls-4', 'yamato-4'].includes(area))
					cPool = cPool.filter(bg => bg.baseName !== baseName);
			}
		}
	}
	self.__AP_MAP=map;

	for (const quest in stageAreas) {
		for (const stage in stageAreas[quest]) {
			let alt = rng() > .5;
			for (const area of stageAreas[quest][stage]) {
				if (map[quest][area].alt + 1) {
					alt = map[quest][area].alt;
					break;
				}
			}
			altMap[quest + stage] = alt;
		}
	}
}

self.__APRBG = randomiseBGs;
addEventListener('keypress', e=>e.key==='1'&&randomiseBGs());

let bossKill;

addEventListener('sectionChanged', _ => bossKill = 0);
addEventListener('afterGameUpdate', event => bossKill |= !!event.target.scene.bossKillEffect);

export function drawRandomBG(game, cx) {
	const key = game.currentQuest !== 'maiden' && game.scene.underwater ? 'water' : game.currentQuest === 'nuinui' && game.currentStage === 'holo_hq' && game.scene.currentSection.pos.y ? {
		'320': 'mori',
		'640': 'ina',
		'0': 'kiara'
	}[game.scene.currentSection.pos.x] || 'holo_hq' : game.currentStage;
	const bg = map[game.currentQuest][key];
	(bossKill && ['ina', 'port-4'].includes(key) ? bg.other : bg).draw(game, cx);
	game.scene.isAltColor = altMap[game.currentQuest + game.currentStage];
}

let waterImage;

export class Water extends Actor {
	isPersistent = true;
	x = 0;

	update = game => {
		if (!waterImage) {
			waterImage = document.createElement('canvas');
			waterImage.width = 256;
			waterImage.height = 22;
			const cx = waterImage.getContext('2d');
			cx.drawImage(game.assets.images.NNM_Archipelago_water, 0, 0);
			cx.globalCompositeOperation = 'source-in';
			cx.drawImage(game.assets.images.bg_boat, 0, -113);
		}

		if ((this.x += (this.s = (game.scene.lockedViewPos ?? game.scene.currentSection.pos).x) < 400 ? 5 : 1) > 0) this.x -= 256;
		game.scene.customDraw.push(this.#customDraw);
	}

	#customDraw = game => {
		for (let i = 0; i < 3; i++) {
			const o = this.s - game.scene.view.pos.x;
			const x = i * 256 + this.x + o, c = 7 * 16 + o;
			if (this.s < 400 || x < c - 256)
				game.ctx1.drawImage(waterImage, x, 192 - 22);
			else if (x < c)
				game.ctx1.drawImage(waterImage, 0, 0, c - x, 22, x, 192 - 22, c - x, 22);
		}
	}
}
