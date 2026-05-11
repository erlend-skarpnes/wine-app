# Vinmonopolet as the sole wine data source

All wine product data (name, type, region, grapes, pairings, etc.) is sourced exclusively from Vinmonopolet's API and cached locally. The app targets Norwegian users who buy from Vinmonopolet, so its catalogue covers exactly the wines they own. Generic wine databases (OpenFoodFacts, Vivino, etc.) were not pursued because they lack the Vinmonopolet-specific product codes and barcodes that appear on the bottles users are scanning.
