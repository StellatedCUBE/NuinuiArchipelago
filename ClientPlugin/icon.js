let badges;
function getBadges() {
	if (!badges) {
		badges = document.createElement('canvas');
		badges.width = 90;
		badges.height = 18;
		const cx = badges.getContext('2d');
		cx.filter = 'invert(1)';
		for (let i = 0; i < 80; i += 18)
			cx.drawImage(NNM.game.assets.images.vfx_explosion, 0, 0, 18, 18, i, 0, 18, 18);
		cx.filter = 'none';
		for (let i = 0; i < 5; i++)
			cx.drawImage(NNM.game.assets.images.sp_holox, i * 10, 0, 10, 10, i * 18 + 4, 4, 10, 10);
	}
	return badges;
}

let maidenStages;
function getMaidenStages() {
	if (!maidenStages) {
		maidenStages = document.createElement('canvas');
		maidenStages.width = 640;
		maidenStages.height = 24;
		const cx = maidenStages.getContext('2d');
		cx.fillStyle = '#000';
		cx.fillRect(0, 0, 640, 24);
		for (let i = 1; i < 29; i++); {
			cx.drawImage(NNM.game.assets.images.ui_digits, (0|(i / 10)) * 11, 0, 10, 18, 1, 2, 10, 18);
			cx.drawImage(NNM.game.assets.images.ui_digits, i % 10 * 11, 0, 10, 18, 12, 2, 10, 18);
			cx.translate(22, 0);
		}
	}
	return maidenStages;
}

export function getIcon(item, anim) {
	switch (item >> 16) {
		case 0: return [NNM.game.assets.images.sp_gem, [0, 0, 16, 16]];
		case 1: return [NNM.game.assets.images.ui_level_icon, [Math.min(item & 7, 6) << 5, 0, 32, 32]];
		case 2: return [getMaidenStages(), [(item & 31) * 22, 0, 24, 24]];
		case 3: return (item & 1) ? [NNM.game.assets.images.sp_noel_idle, [3, 4, 24, 35]] : [NNM.game.assets.images.sp_flare_idle, [4, 2, 24, 37]];
		case 4: return (item & 7) ? [NNM.game.assets.images[['sp_peko_rocket', 'sp_petal', 'sp_marine_sword', 'sp_ice_shield', 'sp_kirito'][(item & 7) - 1]]] : [NNM.game.assets.images.sp_arrow, [25, 12, 14, 6]];
		case 5: return [NNM.game.assets.images.sp_key, [(item & 7) << 4, 0, 16, 16]];
		case 6: return [NNM.game.assets.images.ui_items, [(item & 7) * 20, 0, 20, 20]];
		case 7: return [getBadges(), [(item & 7) * 18, 0, 18, 18]];
		case 8: return [NNM.game.assets.images.ui_crystal, [(item - 1 & 3) * 24, 0, 24, 24]];
		case 9: return [NNM.game.assets.images.sp_cup, [0, 0, 16, 16]];
		case 10: return [NNM.game.assets.images.sp_star, [anim ? (NNM.game.frameCount >> 3 & 3) * 8 : 24, 0, 8, 8]];
		case 11: return [NNM.game.assets.images.sp_heart];
		case 12: return [NNM.game.assets.images.NNM_Archipelago_help];
		case 13: return [NNM.game.assets.images.sp_nousagi, [0, 0, 24, 24]];
		case 14: return [NNM.game.assets.images.NNM_Archipelago_alt];
		case 15: return getIcon(archipelagoState.progressiveLevels[item & 1] | (-~(item & 1) << 16));
		case 16: return [NNM.game.assets.images.NNM_Archipelago_key];
		case 17: return [NNM.game.assets.images.sp_bomb, [0, 0, 12, 12]];
	}
}
