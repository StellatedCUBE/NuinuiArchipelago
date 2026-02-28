enemies = []

def create_locations(world, item, location, data):
	p = world.player
	level_region = world.create_region('nnq_hq')
	world.base_region.connect(level_region,rule=lambda s,i=item.get_item((item.ItemCategory.LEVEL,261)).name,j=item.get_item((item.ItemCategory.LEVEL,773)).name:s.has(i,p)or s.has(j,p)or s.has('progressive Nuinui Quest level',p,6))

	regions = []
	for arena in data.MYTH:
		region = world.create_region('nnq_hq_' + arena)
		level_region.connect(region, rule = lambda state, key = arena + ' key': state.has(key, p))
		regions.append(region)
	
	def number_of_floors(state):
		return sum(state.can_reach(region) for region in regions)
	
	if world.options.nnq_boss_all_drop:
		for i in range(len(data.MYTH)):
			world.add_location((location.LocationCategory.HQ_LEVEL, i + 1), level_region, lambda state, floor=i: number_of_floors(state) > floor)
	
	world.add_location((location.LocationCategory.LEVEL_CLEAR_NUINUI if world.options.prq else location.LocationCategory.LEVEL_CLEAR_NAMELESS, 5), level_region, lambda state: number_of_floors(state) == 5)
