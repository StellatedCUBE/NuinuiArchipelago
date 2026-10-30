from . import item
from . import location
from . import data
from . import boss
from .nnq_levels import level_modules
from .arenas import nnq_arenas

from BaseClasses import ItemClassification
from rule_builder.rules import CanReachLocation, Has, HasAny

def nnq(world):
	if world.options.nnq_starting_character.value:
		world.push_precollected(world.create_item('progressive Noel'))
		world.add_item(boss.MACE)
		weapon = 'mace'
		if world.options.nnq_other_character.value:
			world.add_item(boss.FLARE)
			world.add_item(item.ItemCategory.DUAL_PISTOLS)
			for i in data.SHOTS:
				world.add_item(i)
		else:
			world.push_precollected(item.FNNQItem('NOEL NUINUI QUEST', ItemClassification.progression, None, world.player))
			world.add_item((item.ItemCategory.FLARE_ITEM, 4))
			for i in range(5):
				world.add_item((item.ItemCategory.KEY, i))
				world.add_item((item.ItemCategory.HOLOX, i))
	else:
		world.push_precollected(world.create_item(boss.FLARE))
		if world.options.nnq_flare_starting_weapon.value:
			world.add_item(item.ItemCategory.DUAL_PISTOLS)
			for i, shot in enumerate(data.SHOTS):
				if world.options.nnq_flare_starting_weapon.value - 1 == i:
					world.push_precollected(world.create_item(shot))
					weapon = shot
				else:
					world.add_item(shot)
		else:
			weapon = boss.PISTOLS
			world.push_precollected(world.create_item(item.ItemCategory.DUAL_PISTOLS))
			for i in data.SHOTS:
				world.add_item(i)
		if world.options.nnq_other_character.value:
			world.add_item(boss.NOEL)
			world.add_item(boss.NOEL)
		elif world.options.nnq_goal.value == 1:
			world.options.nnq_goal.value = 0
	
	if world.characters & 1:
		for it in item.item_types:
			if it.type in (item.ItemCategory.KEY, item.ItemCategory.HOLOX, item.ItemCategory.FLARE_ITEM):
				world.add_item(it)

	levels = 7 if world.options.nnq_all_stages else (6 if world.options.nnq_goal.value == 4 else (7 if world.options.nnq_goal.value > 1 else 5))
	level_items = []
	level_item_bits = 64 if world.options.prq else 64|128
	heart_entries = 10
	if world.options.nnq_heart_checks:
		heart_entries = 22
	for i in range(levels):
		if world.options.nnq_stage_shuffle and world.options.nnq_stage_items:
			world.add_item((item.ItemCategory.LEVEL, level_item_bits|i))
			level_items.append(world.items[-1])
		level_modules[i].create_locations(world, item, location, data)
		if world.options.nnq_enemysanity:
			heart_entries += sum(name != 'Heart' for _, name, x, y in level_modules[i].enemies)
	
	world.filler.append((item.ItemCategory.HEART, heart_entries))
	world.filler.append((item.ItemCategory.HELP, 4))

	for i in range(8):
		world.add_item(item.ItemCategory.HELP)

	clear_category = location.LocationCategory.LEVEL_CLEAR_NUINUI if world.options.prq else location.LocationCategory.LEVEL_CLEAR_NAMELESS
	level_names = [location.get_location((clear_category, i) if i != 4 else 'Good End').name for i in range(7)]
	
	arenas = [a for a in nnq_arenas() if a.region in world.multiworld.regions.region_cache[world.player]]
	for i, arena in enumerate(arenas):
		cn = location.get_location((location.LocationCategory.BOSS_DROP, i), False)
		cn = (cn.flags.value & 3) if cn else 0
		if (cn & world.characters) != cn:
			arena.boss = boss.by_name['none']
	boss.allocate_bosses(world, world.options.nnq_boss_shuffle, arenas, boss.Q_ALL if world.options.nnq_boss_cross else boss.Q_NNQ)
	for i, arena in enumerate(arenas):
		region = world.get_region(arena.region)
		rule = arena.rule(world.player)
		if rule:
			for entrance in region.entrances:
				entrance.access_rule = lambda state, previous = entrance.access_rule, new = rule: previous(state) and new(state)
		if (arena.drop == boss.Drop.ALWAYS or (world.options.nnq_boss_all_drop and arena.drop != boss.Drop.NEVER)) and not (arena.drop == boss.Drop.NOEL and world.characters == 1):
			world.add_location((location.LocationCategory.BOSS_DROP, i), world.get_region('nnq_castle_0_384') if arena.drop == boss.Drop.NOEL else region)
	world.boss_data['nnq'] = [arena.boss.name for arena in arenas]

	if world.options.nnq_quick_clear_checks:
		qc_region = world.create_region('Quick Clear')
		world.base_region.connect(qc_region, rule=(Has(item.get_item((item.ItemCategory.FLARE_ITEM, 4)).name) & HasAny(boss.NOEL, boss.FEATHERS)) | Has(world.glitches_item_name))
		for i, stage in enumerate([*level_names[:4], 'Bad End' if world.characters & 1 else 'Good End']):
			world.add_location(i + 50, qc_region, CanReachLocation(stage), stage == 'Good End' or any(
				(arena.boss.tags & boss.T_LONG) and data.LEVELS[i] in arena.name and arena.name not in ('Crystal Falls midboss', 'Demon Lord Castle lift', 'Demon Lord Castle turret')
				for arena in arenas
			))
	
	if world.options.nnq_other_achievement_checks:
		only_flare_rule = Has(item.get_item((item.ItemCategory.CHARACTER, 0)).name)
		exclude_only_noel = False
		only_noel_hard = False
		iv_region = fit_region = None

		for arena in arenas:
			if arena.name.endswith("'s office"):
				exclude_only_noel |= arena.boss.noel_difficulty > 2
				only_noel_hard |= arena.boss.noel_difficulty
				only_flare_rule &= HasAny(*arena.boss.flare_requirements)

			match arena.name:
				case 'Crystal Falls midboss':
					world.add_location('Perfect Debut', world.get_region(arena.region), None, arena.boss.tags & boss.T_BAD_DEBUT)
				case 'Crystal Falls final boss':
					world.add_location(
						'Unfazed',
						world.get_region(arena.region),
						(Has(data.SHOTS[3]) & Has(item.get_item((item.ItemCategory.CHARACTER, 0)).name)) | Has(world.glitches_item_name) if arena.boss.tags & boss.T_NEEDS_JUMP_OR_CUTLASS and world.characters & 1 else None,
						arena.boss.tags & boss.T_NEEDS_JUMP or (arena.boss.tags & boss.T_NEEDS_JUMP_OR_CUTLASS and world.characters == 2)
					)
				case 'Underworld Casino final boss':
					p_rules = [Has(item.get_item(item.ItemCategory.DUAL_PISTOLS).name) & Has(item.get_item((item.ItemCategory.CHARACTER, 0)).name), Has(item.get_item((item.ItemCategory.CHARACTER, 1)).name)]
					rules = []
					if item.get_item(item.ItemCategory.DUAL_PISTOLS).name in arena.boss.flare_requirements:
						rules.append(p_rules[0])
					if not arena.boss.noel_difficulty:
						rules.append(p_rules[1])
					match rules:
						case []: rule = Has(world.glitches_item_name) & (p_rules[0] | p_rules[1]) if getattr(world.multiworld, 'generation_is_fake', False) else None
						case [x]: rule = x
						case [x, y]: rule = x | y
					world.add_location('Elite Win', world.get_region(arena.region), rule, not rules)
				case 'Pirate Harbor boss':
					world.add_location('No Scratches', world.get_region(arena.region), None, arena.boss.name == 'Demon Lord Miko')

			match arena.boss.name:
				case 'Ayame':
					if iv_region is None:
						iv_region = world.create_region("Introvert's Weakness")
						world.add_location("Introvert's Weakness", iv_region, Has(boss.FLARE) & HasAny(boss.PISTOLS, data.SHOTS[0]))
					world.get_region(arena.region).connect(iv_region)
				case 'Ame':
					if fit_region is None:
						fit_region = world.create_region('Frozen in Time')
						world.add_location('Frozen in Time', fit_region)
					world.get_region(arena.region).connect(fit_region)
		
		if levels > 5:
			world.add_location('Only Flare!', world.get_region('nnq_hq_roof'), only_flare_rule)
			world.add_location(
				'Only Noel!',
				world.get_region('nnq_hq_roof'),
				Has(boss.NOEL) & (Has(boss.NOEL, 2) | HasAny(boss.MACE, world.glitches_item_name)) if only_noel_hard else Has(boss.NOEL),
				exclude_only_noel
			)

	if world.options.nnq_goal.value != 4:
		for i in range(5):
			world.add_goal_feat(data.FEAT_NNQ_LEVEL_CLEAR + i)

	match world.options.nnq_goal.value:
		case 0:
			world.add_goal_location(*level_names[:4])
			world.add_goal_location('Bad End')
		case 1:
			world.add_goal_location(*level_names[:5])
			world.add_goal_feat(data.FEAT_NNQ_GOOD_END)
		case 2:
			world.add_goal_location(*level_names[:4])
			world.add_goal_location('Good End' if world.options.nnq_starting_character.value else 'Bad End')
			world.add_goal_location(*level_names[5:])
			world.add_goal_feat(data.FEAT_NNQ_LEVEL_CLEAR + 5)
			world.add_goal_feat(data.FEAT_NNQ_LEVEL_CLEAR + 6)
		case 3:
			world.add_goal_location(*level_names)
			for i, arena in enumerate(arenas):
				if arena.boss.name != 'None':
					world.add_goal_feat(i + data.FEAT_NNQ_BOSS_DEFEAT)
		case 4:
			world.add_goal_location(level_names[5])
			world.add_goal_feat(data.FEAT_NNQ_LEVEL_CLEAR + 5)
			world.place_item(level_names[5], None)
			world.place_item((location.LocationCategory.HQ_LEVEL, 5), None)

	if world.options.nnq_stage_shuffle:
		possible_starts = [i for i in range(levels) if i != 5 and (
			i in (0, 1, 3) or
			world.options.nnq_enemysanity or
			(i != 2 and (
				(world.options.nnq_boss_all_drop and (i == 6 or next(arena for arena in arenas if data.LEVELS[i] in arena.name).easy_with(weapon))) or
				(not world.options.nnq_boss_all_drop and all(arena.easy_with(weapon) for arena in arenas if data.LEVELS[i] in arena.name))
			))
		)]
		if level_items:
			world.potential_starting_levels.extend(level_items[i] for i in possible_starts)
		else:
			level_ordering = [*range(levels)]
			while True:
				world.random.shuffle(level_ordering)
				if (
					level_ordering[0] in possible_starts and
					5 not in level_ordering[:3 if world.options.nnq_enemysanity or (world.options.nnq_boss_all_drop and world.options.nnq_hidden_area_checks) else 5] and
					(world.options.nnq_starting_character.value or 4 not in level_ordering[:3])
				): break
			if world.options.nnq_goal.value == 4:
				level_ordering.remove(5)
				level_ordering.append(5)
			world.push_precollected(world.create_item((item.ItemCategory.LEVEL, level_item_bits|level_ordering[0])))
			world.needs_starting_level = False
			for i in range(levels if world.single_quest and world.options.nnq_goal < 3 else levels - 1):
				placed = None
				if i < levels - 1: placed = (item.ItemCategory.LEVEL, level_item_bits|level_ordering[i + 1])
				world.place_item(('Bad End' if world.characters == 1 else 'Good End') if level_ordering[i] == 4 else level_names[level_ordering[i]], placed)
	elif world.options.nnq_stage_items:
		for i in range(levels):
			world.add_item((item.ItemCategory.LEVEL_PROGRESSIVE, 0))
		world.potential_starting_levels.append(world.items[-1])
	else:
		world.push_precollected(world.create_item((item.ItemCategory.LEVEL_PROGRESSIVE, 0)))
		world.needs_starting_level = False
		for i in range(levels if world.single_quest and world.options.nnq_goal < 3 else levels - 1):
			placed = (item.ItemCategory.LEVEL_PROGRESSIVE, 0)
			if i == levels - 1: placed = None
			world.place_item(('Bad End' if world.characters == 1 else 'Good End') if i == 4 else level_names[i], placed)

