export function getIcon(item, anim) {
	switch (item >> 16) {
		case 0: return [NNM.game.assets.images.sp_gem, [0, 0, 16, 16]];
		case 1: return [NNM.game.assets.images.ui_level_icon, [Math.min(item & 7, 6) << 5, 0, 32, 32]];

		case 3: return [(item & 1) ? NNM.game.assets.images.sp_noel_idle : NNM.game.assets.images.sp_flare_idle];
		case 4: return (item & 7) ? [NNM.game.assets.images[['sp_peko_rocket', 'sp_petal', 'sp_marine_sword', 'sp_ice_shield', 'sp_kirito'][(item & 7) - 1]]] : [NNM.game.assets.images.sp_arrow, [25, 12, 14, 6]];
		case 5: return [NNM.game.assets.images.sp_key, [(item & 7) << 4, 0, 16, 16]];
		case 6: return [NNM.game.assets.images.ui_items, [(item & 7) * 20, 0, 20, 20]];
		case 7: return [NNM.game.assets.images.sp_holox, [(item & 7) * 10, 0, 10, 10]];
		case 8: return [NNM.game.assets.images.ui_crystal, [(item - 1 & 3) * 24, 0, 24, 24]];
		case 9: return [NNM.game.assets.images.sp_cup, [0, 0, 16, 16]];
		case 10: return [NNM.game.assets.images.sp_star, [anim ? (NNM.game.frameCount >> 3 & 3) * 8 : 24, 0, 8, 8]];
		case 11: return [NNM.game.assets.images.sp_heart];
		case 12: return [NNM.game.assets.images.NNM_Archipelago_help];
		case 13: return [NNM.game.assets.images.sp_nousagi, [0, 0, 24, 24]];
		case 14: return [NNM.game.assets.images.NNM_Archipelago_alt];
		case 15: return getIcon(archipelagoState.progressiveLevels[item & 1] | (-~(item & 1) << 16));
		case 16: return [NNM.game.assets.images.NNM_Archipelago_key];
	}
}
