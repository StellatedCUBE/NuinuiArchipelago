from . import item
from . import location
from . import data

def prq(world):
	p = world.player

	crystals = []
	for i in range(1, 5):
		world.add_item((item.ItemCategory.BIG_CRYSTAL, i))
		crystals.append(world.items[-1].name)

	level_item_bits = 512 if world.options.nnq else 256|512
	level_location_type = location.LocationCategory.LEVEL_CLEAR_RANDOM if world.options.nnq else location.LocationCategory.LEVEL_CLEAR_NAMELESS
	for i, level in enumerate(data.levels[:6]):
		if i == 5:
			if world.options.prq_goal.value:
				world.add_item((item.ItemCategory.LEVEL, level_item_bits|i))
				world.potential_starting_levels.append(world.items[-1])
				world.add_location((level_location_type, i), world.base_region, lambda state, item = world.items[-1].name: state.has(item, p))
			else:
				world.add_location((level_location_type, i), world.base_region, lambda state: all(state.has(c, p) for c in crystals))
		else:
			world.add_item((item.ItemCategory.LEVEL, level_item_bits|i))
			world.potential_starting_levels.append(world.items[-1])
			region = world.create_region('prq_' + level)
			world.base_region.connect(region, rule = lambda state, item = world.items[-1].name: state.has(item, p))

			if i == 1:
				region2 = world.create_region('prq_casino2')
				region.connect(region2, rule = lambda state: state.has('casino key', p))
				world.add_location(8, region)
				if world.options.prq_casino_access:
					world.add_item('casino key')
				else:
					world.place_item(8, 'casino key')

			for j in range(1, 4):
				world.add_location((location.LocationCategory.NOUSAGI, i * 4 + j), region2 if i == 1 and j > 1 else region)
	
	world.filler.append((300, 1))
	world.filler.append(('Nousagi', 15))


