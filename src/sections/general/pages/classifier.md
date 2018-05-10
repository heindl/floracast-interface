# About The Model

The current focus is on common mushrooms in United States. They are a good development platform because they vary in the length of time they fruit and in the signals that lead to this fruiting, and I'm assuming they necessarily must be fruiting to be reported as a n occurrence.

There is also a strong community of people who are passionate and knowledgable.

A separate model for each taxon is generated using observed occurrences from public data sources.
* Global Biodiversity Information Forum (GBIF)
* INaturalist.com
* MushroomObserver.com

In order to generate a sufficient number of occurrences, I have a very aggressive name usage combinator that looks for synonyms across the previous sources, and NatureServe. It may be too aggressive, so if the synonym map field <a>synonym page</a> suggests a problem, please let me know.

To account for positive only data, I'm generating negative samples randomly, though relatively evenly distributed across continental North America - south of the tundra - and throughout the year.

The model is heavily biased toward negative samples - 5:1 to 10:1 - which causes accuracy problems, but so far most taxa are quite precise, and I'd rather error on the side of fewer predictions.

These occurrences are preprocessed and combined with derived 
features for each location:
    - Coordinates hashed as s3 geometry cells.
    - Elevation.
    - Daily precipitation and temperature readings for the previous four months  from the National Oceanic and Atmospheric Administration (NOAA) Global Surface Summary of the Day (GSOD) records.
    - Length of daylight for the previous three months.
    - World Wildlife Fund (WWF) Terrestrial EcoRegion categories.
 
The obvious limitation is no information about the actual landscape of the occurrence. I plan to tackle that in the next few months, and believe it can be done with public Satellite and any other remotely sensed data. If you have any recommendations for this, I would love to hear them and could potentially pay you as a consultant.

The occurrences are are then fed into Tensorflow Deep Nueral Network Classifier and predictions uploaded into the server. Right now this process runs on Tuesday and Fridays, in the future it will poll for new occurrences several times a day, generate a new model, and run the classifier every day.

I'm a hacker and not a scientist, but if this project could help you with your research and you would like to use it to publish, please let me know and I would be glad to help.

## Next Steps
* Incorporate features from satellites and any other publicly available remotely sensed data into the model.
* Add additional occurrence records 

## Failed Experiments:
##### Kernel Density Classifer
Intended to avoid generating random predictions. The goal was to draw a circle around known occurrences. The results were very poor, but I would give it another shot with new data.
Many papers I've read use a Maximum Entropy approach to occurrence only data, and I hoped this could work in a similar way.
##### Combining Multiple Taxa into a Classifier
* Goal was to simplify engineering, and combine models within an ecoregion. I thought I could take all probabilities above 50%.
