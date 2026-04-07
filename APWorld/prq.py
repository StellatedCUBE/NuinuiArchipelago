from . import item
from . import location
from . import data
from .arenas import prq_arenas
from .boss import allocate_bosses, Drop, Q_PRQ, Q_ALL
from .prq_enemy_data import prq_enemy_data

def prq(world):
	p = world.player

	crystals = []
	for i in range(1, 5):
		world.add_item((item.ItemCategory.BIG_CRYSTAL, i))
		crystals.append(world.items[-1].name)
	
	for i in range(5):
		world.add_item(item.ItemCategory.BOMB)
	
	shop = world.create_region('prq_shop')
	if not world.single_quest or world.multiworld.players > 1:
		world.add_location((location.LocationCategory.SHOP, 0), shop)
		world.add_location((location.LocationCategory.SHOP, 1), shop, lambda state: state.has('200 crystals', p))
		world.add_location((location.LocationCategory.SHOP, 2), shop, lambda state: state.has('200 crystals', p))
		for i in range(-3, 0):
			world.options.start_location_hints.value.add(world.locations[i][0].name)
	
	world.add_item(200)

	level_item_bits = 512 if world.options.nnq else 256|512
	level_location_type = location.LocationCategory.LEVEL_CLEAR_RANDOM if world.options.nnq else location.LocationCategory.LEVEL_CLEAR_NAMELESS
	for i, level in enumerate(data.LEVELS[:6]):
		if i == 5:
			if world.options.prq_goal.value:
				world.add_item((item.ItemCategory.LEVEL, level_item_bits|i))
				world.add_location((level_location_type, i), shop, lambda state, item = world.items[-1].name: state.has(item, p))
			else:
				world.add_location((level_location_type, i), shop, lambda state: all(state.has(c, p) for c in crystals))
		else:
			if world.options.prq_goal.value:
				world.add_goal_feat(data.FEAT_PRQ_LEVEL_CLEAR + i)
			world.add_item((item.ItemCategory.LEVEL, level_item_bits|i))
			region = world.create_region('prq_' + level)
			if i < 4:
				world.potential_starting_levels.append(world.items[-1])
				source_region = world.base_region
				region.connect(shop)
			else:
				source_region = shop
			source_region.connect(region, rule = lambda state, item = world.items[-1].name: state.has(item, p))

			if i == 1:
				region2 = world.create_region('prq_casino2')
				region.connect(region2, rule = lambda state: state.has('casino key', p))
				if world.options.prq_casino_access:
					world.add_item('casino key')
				else:
					world.place_item((location.LocationCategory.BOSS_DROP, 23), 'casino key')

				if world.options.prq_casino_checks:
					world.filler.append((1, 2))
					world.filler.append((2, 2))
					world.filler.append((10, 1))
					for j in range(6):
						world.add_location((location.LocationCategory.PACHINKO, j), region)

			for j in range(1, 4):
				world.add_location((location.LocationCategory.NOUSAGI, i * 4 + j), region2 if i == 1 and j > 1 else region)

			for l, type_, _, y in prq_enemy_data[i]:
				if world.options.prq_crystalsanity if type_ == 'Crystal' else (world.options.prq_cratesanity if type_ == 'Crate' else world.options.prq_enemysanity):
					world.add_location((location.LocationCategory.SANITY_RANDOM, l), region2 if i == 1 and y > 36 else region)
			
			world.add_location((level_location_type, i), region2 if i == 1 else region)

		if i == 5 or world.options.prq_goal.value:
			world.add_goal_location(world.locations[-1][0])
			if world.single_quest and not world.options.prq_goal.value:
				world.place_item(world.locations[-1][0], None)
	
	world.add_goal_feat(data.FEAT_PRQ_LEVEL_CLEAR + 5)
	
	world.filler.append(('Nousagi', 15))

	if world.options.prq_crystalsanity:
		world.filler.append((8, sum(sum(type_ == 'Crystal' for _, type_, _, _ in level) for level in prq_enemy_data)))
	
	if world.options.prq_cratesanity:
		world.filler.append((1, sum(sum(type_ == 'Crate' for _, type_, _, _ in level) for level in prq_enemy_data)))
	
	if world.options.prq_enemysanity:
		c = sum(sum(type_ not in ('Crate', 'Crystal') for _, type_, _, _ in level) for level in prq_enemy_data) // 3
		world.filler.append((item.ItemCategory.HEART, c))
		world.filler.append((1, c))
		world.filler.append((2, c))

	arenas = prq_arenas()
	allocate_bosses(world.random, world.options.prq_boss_shuffle, arenas, Q_ALL if world.options.prq_boss_cross else Q_PRQ)
	for i, arena in enumerate(arenas):
		if arena.drop == Drop.ALWAYS or (world.options.prq_boss_all_drop and arena.drop != Drop.NEVER):
			world.add_location((location.LocationCategory.BOSS_DROP, i + 21), world.get_region(arena.region))
	
	world.boss_data['prq'] = [arena.boss.name for arena in arenas]
