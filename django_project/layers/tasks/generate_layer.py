# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Background task for generating layers
"""
from core.celery import app
from layers.generator import run_generate_gee_layers


@app.task(name='generate_baseline_nrt_layers')
def generate_baseline_nrt_layers():
    """Trigger task to generate layers using GEE."""
    run_generate_gee_layers()
