#!/usr/bin/env python
# -*- coding: utf-8 -*-

import logging

logging.basicConfig(format='%(asctime)s : %(filename)s : %(levelname)s : %(message)s')
logger = logging.getLogger()
logger.setLevel(logging.INFO)

import os
SCRIPT_DIR = os.path.abspath(os.path.dirname(__file__))
import re
import json
import yaml
import argparse

DEFAULT_WIKIBASE_INSTANCE = 'http://localhost:8181'
# DEFAULT_WIKIBASE_INSTANCE = 'https://wikibase.juncture-digital.org'

CREDS = yaml.load(open(f'{SCRIPT_DIR}/creds.yaml', 'r').read(), Loader=yaml.FullLoader)

from wikibase_api import Wikibase

_instance = None
def get_wikibase_instance():
  global _instance
  if not _instance:
    _instance = Wikibase(
      api_url=f'{WIKIBASE}/w/api.php',
      oauth_credentials=CREDS[WIKIBASE]
    )
  return _instance

def find_entity(label, language='en', entity_type='item', limit=10, offset=0):
  logger.info(f'Finding entity: label={label}, language={language}, entity_type={entity_type} limit={limit}, offset={offset}')
  logger.info(get_wikibase_instance().entity.search(label, language='en', entity_type='item', limit=10, offset=0))
  #for res in get_wikibase_instance().entity.search(label, language, entity_type):
  #  logger.info(res)

def add_entity(**kwargs):
  label = kwargs.get('label')
  if not label: return
  
  entity_type = kwargs.get('entity_type', 'item')
  wb = get_wikibase_instance()
 
  # find_entity(label, entity_type=entity_type)

  entity = {'labels': {'en': {'language': 'en', 'value': label}}}
  if 'description' in kwargs:
    entity['descriptions'] = {'en': {'language': 'en', 'value': kwargs['description']}}
  if 'aliases' in kwargs:
    entity['aliases'] = {'en': [{'language': 'en', 'value': alias} for alias in kwargs['aliases']]}
  if 'claims' in kwargs:
    entity['claims'] = kwargs['claims']
  if entity_type == 'property':
    entity['datatype'] = kwargs.get('datatype', 'string')
  # logger.info(json.dumps(entity, indent=2))
  
  try:
    return wb.entity.add(entity_type, entity)
  except Exception as e:
    logger.error(json.dumps(json.loads(e.args[0]), indent=2))
    # eid = re.findall(r'entity\/([A-Z0-9]+)', e.args[0])[0]
    # return wb.entity.update(label, entity_type)

def do_request(operation, **kwargs):
  # logger.info(kwargs)
  if operation == 'add':
    logger.info(add_entity(**kwargs))

def init_entities(path=f'{SCRIPT_DIR}/entities.yaml'):
  entities = yaml.load(open(path, 'r').read(), Loader=yaml.FullLoader)
  for entity in entities:
    logger.info(add_entity(**entity))
  
if __name__ == '__main__':
  logger.setLevel(logging.INFO)
  parser = argparse.ArgumentParser(description='Wikibase utils')
  parser.add_argument('--wikibase', help=f'Wikibase instance (default={DEFAULT_WIKIBASE_INSTANCE})', default=DEFAULT_WIKIBASE_INSTANCE)
  parser.add_argument('--operation', help='Operation to perform')
  parser.add_argument('--label', help='Entity label')
  parser.add_argument('--description', help='Entity label')
  parser.add_argument('--entity_type', help='Entity type', default='item')
  args = vars(parser.parse_args())
  
  WIKIBASE = args['wikibase']
  
  # logger.info(json.dumps(do_request(**args)))
  init_entities()
