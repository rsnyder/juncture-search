# QHub
<param id="overview">

QHub is a multilingual semantic search engine that uses the [Wikidata knowledge graph](https://www.wikidata.org) as an information hub to locate web resources associated with named entities (people, places, events, etc).

Semantic search denotes search with meaning, as distinguished from lexical search where a search engine looks for literal matches of the query words or variants of them, without understanding the overall meaning of the query.  QHub uses an auto-suggest style search interface that analyzes search input in a users native language and presents the user with a list of named entities to select.  Multiple entities with the same name are disambiguated using entity descriptions and aliases provided by the auto-suggest feature.

After a specific named entity has been identified QHub retrieves all available information for the entity from the Wikidata knowledge graph and uses that information to fetch relevant resources from a wide range of trusted sites including the [Internet Archive](https://archive.org/), [Wikimedia Commons](https://commons.wikimedia.org/wiki/Main_Page), [the Biodiversity Heritage Library (BHL)](https://www.biodiversitylibrary.org/), [JSTOR](https://www.jstor.org), [Artstor](https://artstor.org/) and others.

# How it works
<param id="how-it-works" class="cards clamp-5">

## Entity is selected using search interface

An entity is selected using an auto-suggest style search interface that analyzes search input in a users native language.  Multiple entities with the same name are easily disambiguated using entity descriptions and aliases.

## Entity data is retrieved from Wikidata

Structured data for the selected entity is retrieved from the Wikidata knowledge graph.    

## Relevant resource are returned from multiple sites

The entity data retrieved from Wikidata is used to construct queries that are submitted to multiple content sources to find relavant resources, including images, documents, and other related content.

# Search for Entity

##
<param id="search" class="center" component="wikidata-search">

# Examples
<param id="examples" class="cards entities clamp-5">

- Q171497
- Q34687
- Q5194627
- Q157211
- Q5582
- Q20265518