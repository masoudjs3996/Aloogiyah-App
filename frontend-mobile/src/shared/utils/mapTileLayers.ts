import type { MapSettings } from "./map-service";

// Both HTTPS endpoints serve the same Esri World Imagery layer.
export function createTileLayers(settings: MapSettings): string {
  const js = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");
  return `
const imagerySources=[
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
];
const ImageryLayer=L.TileLayer.extend({
  createTile:function(coords,done){
    const tile=document.createElement('img');
    tile.alt='';tile.referrerPolicy='no-referrer';
    let attempt=0,timer,finished=false;
    const finish=(error)=>{if(finished)return;finished=true;clearTimeout(timer);done(error,tile);};
    const next=()=>{
      clearTimeout(timer);
      if(finished)return;
      if(attempt>=imagerySources.length){finish(new Error('Imagery unavailable'));return;}
      tile.src=L.Util.template(imagerySources[attempt++],coords);
      timer=setTimeout(next,7000);
    };
    tile.onload=()=>finish(null);
    tile.onerror=next;
    tile.cancelLoad=()=>{finished=true;clearTimeout(timer);tile.onload=null;tile.onerror=null;};
    next();return tile;
  }
});
const street=L.tileLayer(${js(settings.tileUrl)},{maxZoom:${settings.maxZoom},noWrap:true,referrerPolicy:'strict-origin-when-cross-origin',attribution:${js(settings.attribution)}});
const satellite=new ImageryLayer(imagerySources[0],{maxZoom:19,maxNativeZoom:19,noWrap:true,attribution:'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'});
satellite.on('tileunload',e=>{if(e.tile.cancelLoad)e.tile.cancelLoad();});
let activeLayer=satellite,hasTiles=false,healthTimer;
function armHealth(){
  clearTimeout(healthTimer);
  healthTimer=setTimeout(()=>{
    if(hasTiles)return;
    activeLayer.redraw();
    if(!hasTiles)armHealth();
  },16000);
}
[street,satellite].forEach(layer=>{
  layer.on('loading',()=>{if(activeLayer===layer){hasTiles=false;armHealth();}});
  layer.on('tileload',()=>{if(activeLayer===layer){hasTiles=true;clearTimeout(healthTimer);}});
});
map.on('baselayerchange',e=>{activeLayer=e.layer;hasTiles=false;armHealth();});
map.on('unload',()=>clearTimeout(healthTimer));
satellite.addTo(map);armHealth();
L.control.layers({'ماهواره‌ای':satellite,'نقشه':street},null,{collapsed:false}).addTo(map);
`;
}
