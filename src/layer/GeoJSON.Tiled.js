
L.GeoJSON.Tiled = L.GeoJSON.extend({
    options: {
        maxZoom: 18,
        minZoom: 0
    },
    initialize: function(url, o) {
        L.Util.setOptions(this, o);
        L.GeoJSON.prototype.initialize.call(this);
        this._url = url;
        this._tiles = {};
    },
    onAdd: function(map) {
        L.GeoJSON.prototype.onAdd.call(this, map);
        map.on("moveend", this._update, this);
        this._update();
    },
    _update: function() {
        if(this._map._panTransition && this._map._panTransition._inProgress) {
            return;
        }

        var b = this._map.getPixelBounds();
        var tsz = 256; // TODO: this should be an option
        var z = this._map.getZoom();

        if(z > this.options.maxZoom || z < this.options.minZoom) {
            return;
        }

        var nw = new L.Point(
            Math.floor(b.min.x / tsz),
            Math.floor(b.min.y / tsz)
        );
        var se = new L.Point(
            Math.floor(b.max.x / tsz),
            Math.floor(b.max.y / tsz)
        );

        var tb = new L.Bounds(nw, se);
        this.clearLayers();
        this._addTilesFromCenterOut(tb);
    },
    _addTilesFromCenterOut: function(b) {
        var c = b.getCenter();
        var z = this._map.getZoom();
        var i,j;
        var q = [];
        for(j=b.min.y; j<=b.max.y; j++) {
            for(i=b.min.x; i<=b.max.x; i++) {
                q.push(new L.Point(i, j));
            }
        }
        q.sort(function(a, b) {
            return a.distanceTo(c) - b.distanceTo(c);
        });
        for(i=0; i<q.length; i++) {
            this._addTile(q[i]);
        }
    },
    _addTile: function(tp) {
        var z = this._map.getZoom();
        var l = Math.pow(2, z);
        var k = z+":"+tp.x+":"+tp.y;
        if(tp.x < 0 || tp.x > l) return;
        if(tp.y < 0 || tp.y > l) return;
        if(k in this._tiles) {
            this.addGeoJSON(this._tiles[k]);
        } else {
            var url = this.getTileUrl(tp, z);
            var succ = L.Util.bind(function(d) {
                this.addGeoJSON(d);
                this._tiles[k] = d;
            }, this);
            $.ajax(url, {success: succ});
        }
    },
    getTileUrl: function(tile_point, zoom) {
        return L.Util.template(this._url, {
            x: tile_point.x, y: tile_point.y,
            z: zoom
        });
    }
});
