from . import item
from . import location
from . import data
from .nnq_levels import level_modules
from .arenas import nnq_arenas
from .boss import allocate_bosses, Drop, Q_NNQ, Q_ALL

def nnq(world):
	world.push_precollected(world.create_item('Noel' if world.options.nnq_starting_character.value else 'Flare'))
	world.add_item('Flare' if world.options.nnq_starting_character.value else 'Noel')

	levels = 7 if world.options.nnq_all_stages or world.options.nnq_goal.value > 1 else 5
	level_items = []
	level_item_bits = 256 if world.options.prq else 256|512
	heart_entries = 10
	for i in range(levels):
		if world.options.nnq_stage_shuffle and world.options.nnq_stage_items:
			world.add_item((item.ItemCategory.LEVEL, level_item_bits|i))
			level_items.append(world.items[-1])
		level_modules[i].create_locations(world, item, location, data)
		if world.options.nnq_enemysanity:
			heart_entries += len(level_modules[i].enemies)
	
	world.filler.append(('heart', heart_entries))
	world.filler.append(('help', 4))

	for i in range(8):
		world.add_item('help')

	for it in item.item_types:
		if it.type in (item.ItemCategory.KEY, item.ItemCategory.HOLOX, item.ItemCategory.FLARE_SHOT, item.ItemCategory.FLARE_ITEM):
			world.add_item(it)

	clear_category = location.LocationCategory.LEVEL_CLEAR_NUINUI if world.options.prq else location.LocationCategory.LEVEL_CLEAR_NAMELESS
	level_names = [location.get_location((clear_category, i) if i != 4 else 'Good end').name for i in range(7)]

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
			world.add_goal_location(*level_names)
			world.add_goal_feat(data.FEAT_NNQ_LEVEL_CLEAR + 5)
			world.add_goal_feat(data.FEAT_NNQ_LEVEL_CLEAR + 6)
		case 3:
			world.add_goal_location(*level_names)
			for i in range(data.FEAT_NNQ_BOSS_DEFEAT, data.FEAT_MMQ_COIN):
				world.add_goal_feat(i)
	
	arenas = [a for a in nnq_arenas() if a.region in world.multiworld.regions.region_cache[world.player]]
	allocate_bosses(world.random, world.options.nnq_boss_shuffle, arenas, Q_ALL if world.options.nnq_boss_cross else Q_NNQ)
	for i, arena in enumerate(arenas):
		region = world.get_region(arena.region)
		rule = arena.rule(world.player)
		if rule:
			for entrance in region.entrances:
				entrance.access_rule = lambda state, previous = entrance.access_rule, new = rule: previous(state) and new(state)
		if arena.drop == Drop.ALWAYS or (world.options.nnq_boss_all_drop and arena.drop != Drop.NEVER):
			world.add_location((location.LocationCategory.BOSS_DROP, i), world.get_region('nnq_castle_0_384') if arena.drop == Drop.NOEL else region)
	world.boss_data['nnq'] = [arena.boss.name for arena in arenas]

	if world.options.nnq_stage_shuffle:
		possible_starts = [i for i in range(levels) if i != 5 and (
			i in (0, 1, 3) or
			world.options.nnq_enemysanity or
			(i != 2 and (
				(world.options.nnq_boss_all_drop and (i == 6 or next(arena for arena in arenas if data.LEVELS[i] in arena.name).easy_with(world.options.nnq_starting_character.value))) or
				(not world.options.nnq_boss_all_drop and all(arena.easy_with(world.options.nnq_starting_character.value) for arena in arenas if data.LEVELS[i] in arena.name))
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
			world.push_precollected(world.create_item((item.ItemCategory.LEVEL, level_item_bits|level_ordering[0])))
			world.needs_starting_level = False
			for i in range(levels if world.single_quest and world.options.nnq_goal < 3 else levels - 1):
				placed = None
				if i < levels - 1: placed = (item.ItemCategory.LEVEL, level_item_bits|level_ordering[i + 1])
				world.place_item('Good end' if level_ordering[i] == 4 else (location.LocationCategory.LEVEL_CLEAR_NUINUI, level_ordering[i]), placed)
				world.place_item((location.LocationCategory.LEVEL_CLEAR_NAMELESS, level_ordering[i]), placed)
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
			world.place_item('Good end' if i == 4 else (location.LocationCategory.LEVEL_CLEAR_NUINUI, i), placed)
			world.place_item((location.LocationCategory.LEVEL_CLEAR_NAMELESS, i), placed)

