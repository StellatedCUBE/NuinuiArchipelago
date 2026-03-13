from . import item
from . import location
from . import data

def prq(world):
	p = world.player

	crystals = []
	for i in range(1, 5):
		world.add_item((item.ItemCategory.BIG_CRYSTAL, i))
		crystals.append(world.items[-1].name)
	
	for i in range(5):
		world.add_item(item.ItemCategory.BOMB)
	
	if not world.single_quest or world.multiworld.players > 1:
		world.add_location((location.LocationCategory.SHOP, 0), world.base_region)
		world.add_location((location.LocationCategory.SHOP, 1), world.base_region, lambda state: state.has('200 crystals', p))
		world.add_location((location.LocationCategory.SHOP, 2), world.base_region, lambda state: state.has('200 crystals', p))
		for i in range(-3, 0):
			world.options.start_location_hints.value.add(world.locations[i][0].name)
	
	world.add_item(200)

	level_item_bits = 512 if world.options.nnq else 256|512
	level_location_type = location.LocationCategory.LEVEL_CLEAR_RANDOM if world.options.nnq else location.LocationCategory.LEVEL_CLEAR_NAMELESS
	for i, level in enumerate(data.LEVELS[:6]):
		if i == 5:
			if world.options.prq_goal.value:
				world.add_item((item.ItemCategory.LEVEL, level_item_bits|i))
				world.potential_starting_levels.append(world.items[-1])
				world.add_location((level_location_type, i), world.base_region, lambda state, item = world.items[-1].name: state.has(item, p))
			else:
				world.add_location((level_location_type, i), world.base_region, lambda state: all(state.has(c, p) for c in crystals))
		else:
			if world.options.prq_goal.value:
				world.add_goal_feat(data.FEAT_PRQ_LEVEL_CLEAR + i)
			world.add_item((item.ItemCategory.LEVEL, level_item_bits|i))
			world.potential_starting_levels.append(world.items[-1])
			region = world.create_region('prq_' + level)
			world.base_region.connect(region, rule = lambda state, item = world.items[-1].name: state.has(item, p))

			if i == 1:
				region2 = world.create_region('prq_casino2')
				region.connect(region2, rule = lambda state: state.has('casino key', p))
				game_boss_drop = 'Random Quest Underworld Casino game room boss drop'
				world.add_location(game_boss_drop, region)
				if world.options.prq_casino_access:
					world.add_item('casino key')
				else:
					world.place_item(game_boss_drop, 'casino key')

				if world.options.prq_casino_checks:
					for j in range(6):
						world.add_location((location.LocationCategory.PACHINKO, j), region)

			for j in range(1, 4):
				world.add_location((location.LocationCategory.NOUSAGI, i * 4 + j), region2 if i == 1 and j > 1 else region)
			
			world.add_location((level_location_type, i), region2 if i == 1 else region)

		if i == 5 or world.options.prq_goal.value:
			world.add_goal_location(world.locations[-1][0])
			if world.single_quest and not world.options.prq_goal.value:
				world.place_item(world.locations[-1][0], None)
	
	world.add_goal_feat(data.FEAT_PRQ_LEVEL_CLEAR + 5)
	
	world.filler.append(('Nousagi', 15))

	world.boss_data['prq'] = []
