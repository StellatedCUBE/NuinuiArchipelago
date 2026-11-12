import { needsRoof } from './boss.js';

function noSun(game) {
	game.scene.sun = false;
}

function noRain(game) {
	game.scene.rain = false;
}

function rmInaWater(game) {
}

function layerImage(name, y=0) {
	const img = NNM.game.assets.images['bg_' + name];
	return (game, cx) => cx.drawImage(img, 0, y, 320, 192, 0, 0, 320, 192);
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
	other = this;

	constructor(baseName, layers, alt) {
		this.baseName = baseName;
		this.#layers = layers;
		this.alt = alt;
	}

	draw(game, cx) {
		for (const layer of this.#layers)
			layer(game, cx);
		if (game.scene.skyTransistion && this.baseName !== 'water')
			castleWave[this.baseName === 'castle' ? +this.alt : 2](game, cx);
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
	
	const rng = createLCG(seed);

	if (mode) {

	} else {
		let boat = '', flag;
		for (const line of NNM.code.filesMatching('scene.js')[0].lines.filter(l => l.scope?.startsWith('Scene.drawBackground'))) {
			if (flag) {
				if (line.code.trim() === 'return;') break;
				else boat += line.code.replace(/this\./g, 'game.scene.') + '\n';
			} else if (line.code.includes("=== 'boat'")) flag = true;
		}
		const pool = [
			new Background('boat', [new Function('game', 'cx', boat), noSun, rmInaWater]),
			...pair(
				new Background('castle', [layerImage('castle'), noSun, noRain, rmInaWater], false),
				new Background('castle', [layerImage('castle_alt'), noSun, noRain, rmInaWater], true)
			),
			...pair(
				new Background('holo_hq', [layerImage('holo_hq'), rmInaWater], false),
				new Background('holo_hq', [layerImage('holo_hq_alt'), noSun, rmInaWater], true)
			),
			...pair(
				new Background('heaven', [layerImage('heaven'), heavenForeground(false)], false),
				new Background('heaven', [layerImage('heaven_alt'), heavenForeground(true)], true)
			),
			new Background('mori', [layerImage('calli')]),
			new Background('kiara', [layerImage('kiara'), noSun, noRain]),
			new Background('water', [wave('bg_gura', .008727, 4), layerImage('gura', 192), noRain, rmInaWater]),
			//new Background('sky', [layerImage('castle'), wave('bg_castle2', .07, 2, .75)], false),
			//new Background('sky', [layerImage('castle_alt'), wave('bg_castle_alt2', .07, 2, .75)], true),
			new Background('hub', [(game, cx) => game.scene.drawHubBackground(game, cx, game.arcadeBg = 1), noSun, noRain])
		];
		for (const stage of ['falls','casino','port','yamato'])
			pool.push(...pair(new Background(stage, [layerImage(stage)], false), new Background(stage, [layerImage(stage + '_alt'), noSun], true)));
		
		for (const quest in stageAreas) {
			map[quest] = {};
			let cPool = pool, baseName, rPool;
			for (const area of Object.values(stageAreas[quest]).flat()) {
				do rPool = (
					area === 'kiara' && needsRoof(archipelagoState.slotData.boss.nnq?.[13]) ? cPool.filter(bg => ['kiara', 'hub'].includes(bg.baseName)) :
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
				if (map[quest][area].alt !== undefined) {
					alt = map[quest][area].alt;
					break;
				}
			}
			altMap[quest + stage] = alt;
		}
	}
}

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
