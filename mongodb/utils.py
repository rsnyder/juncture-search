#!/usr/bin/env python
# -*- coding: utf-8 -*-

import logging

logging.basicConfig(format='%(asctime)s : %(filename)s : %(levelname)s : %(message)s')
logger = logging.getLogger()
logger.setLevel(logging.INFO)

import os
SCRIPT_DIR = os.path.abspath(os.path.dirname(__file__))
BASEDIR = os.path.dirname(SCRIPT_DIR)

import argparse
from pymongo import MongoClient

CREDS = dict([line.split('=') for line in open(f'{BASEDIR}/creds.env', 'r').read().split('\n') if line])

MDB_ENDPOINT = f'mongodb+srv://{CREDS["ATLAS"]}/?retryWrites=true&w=majority'


def upload(path):
  logger.info(f'Uploading {path} to MongoDB')
  
  client = MongoClient(MDB_ENDPOINT)
  db = client['images']
  collection = db['depicts']

  with open(path, 'r') as file:
    docs = yaml.safe_load_all(file)
    for doc in docs:
      doc['_id'] = doc['id']
      collection.update_one({'_id' : doc['_id']}, { '$set': doc }, upsert=True)
  client.close()

if __name__ == '__main__':
  logger.setLevel(logging.INFO)
  parser = argparse.ArgumentParser(description='MongoDB utils')
  parser.add_argument('--upload', help='File to upload')

  args = vars(parser.parse_args())
  
  if args['upload']:
    upload(args['upload'])
