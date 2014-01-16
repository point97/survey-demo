Data API
========

Single Select Count
-------------------

.. http:get:: /reports/single-select-count/<question_slug>

    Returns the count of survey responses for each answer in
    the single select.

    **Example request**:

    .. sourcecode:: http

        GET /reports/single-select-count/market

    **Example response**:

    .. sourcecode:: http

        HTTP/1.1 200 OK
        Vary: Accept
        Content-Type: application/json

        {
            "success": true,
            "data": [
                {"answer": "Market A", "count": 4},
                {"answer": "Market B", "count": 2},
            ],
            "meta": {"labels": ["Market A", "Market B"]}
        }

    :query status: one of ``accepted``, ``rejected``, or ``flagged``
    :query start_date: filter results to on or after ``start_date`` formated
                       like: ``%Y-%m-%d``
    :query end_date: filter results to on or before ``end_date`` formatted
                     like: ``%Y-%m-%d``

Grid Standard Deviation
-----------------------

.. http:get:: /reports/grid-standard-deviation/<question_slug>/<interval>

    Groups the responses by type in the given interval and gives the minimum,
    maximum, average, and total of the responses.

    **Example request**:

    .. sourcecode:: http

        GET /reports/grid-standard-deviation/market/month

    **Example response**:

    .. sourcecode:: http

        HTTP/1.1 200 OK
        Vary: Accept
        Content-Type: application/json

        {
            "success": true,
            "data": [
                {
                    "row_label": "Trout",
                    "row_text": "trout",
                    "date": 1385884800000,
                    "minimum": 2,
                    "average": 5,
                    "maximum": 15,
                    "total": 54,
                }, {
                    "row_label": "Trout",
                    "row_text": "trout",
                    "date": 1388563200000
                    "minimum": 2,
                    "average": 5,
                    "maximum": 15,
                    "total": 54,
                },
            ],
            "meta": {"labels": ["Trout"]}
        }

    :query status: one of ``accepted``, ``rejected``, or ``flagged``
    :query start_date: filter results to on or after ``start_date`` formated
                       like: ``%Y-%m-%d``
    :query end_date: filter results to on or before ``end_date`` formatted
                     like: ``%Y-%m-%d``
    :query row: string that matches a ``row_label`` in the question
    :query col: string that matches a ``col_label`` in the question
