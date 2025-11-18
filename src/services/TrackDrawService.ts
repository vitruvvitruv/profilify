import type { IMark } from "../interfaces/IMark";

export class TrackDrawService {

  static textSize = "14px";

  static createMarkSymbol(g: d3.Selection<SVGGElement, unknown, null, undefined>, 
    x: number, y: number, fontColor: string, symbolColor: string, text: string) {
        
        g.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 14)
        .attr("fill", symbolColor);
        
        g.append("text")
        .attr("x", x)
        .attr("y", y + 4)
        .style("text-anchor", "middle")
        .style("fill", fontColor)
        .style("font-weight", "bold")
        .style("font-size", this.textSize)
        .text(text);
  }

  static createOneLineMarkText(g: d3.Selection<SVGGElement, unknown, null, undefined>, 
    x: number, y: number, text: string, mark: IMark, onClick: (m: IMark) => void) {
    
        g.append("text")
        .attr("x", x)
        .attr("y", y)
        .attr("transform", `rotate(-90, ${x}, ${y})`)
        .style("dominant-baseline", "middle")
        .style("fill", "white")
        .style("font-size", this.textSize)
        .text(text)
        .style("cursor", "pointer")
        .on("click", (event) => {
          event.stopPropagation();
          onClick(mark);
        });
  }

  static createKmLabel(g: d3.Selection<SVGGElement, unknown, null, undefined>, 
    x: number, y: number, distance: number, shallMoveLabel: boolean, mark?: IMark, onClick?: (m: IMark) => void) {

      const yPos = shallMoveLabel ? y + 30 : y + 16;
      const kmLabel = g.append("text")
                      .attr("x", x)
                      .attr("y", yPos)
                      .style("text-anchor", "middle")
                      .style("fill", "white")
                      .style("font-weight", "bold")
                      .style("font-size", this.textSize)
                      .text(`${distance.toFixed(1)}`);
        
       if (mark && onClick) {
        kmLabel.style("cursor", "pointer")
              .on("click", (event) => {
              event.stopPropagation();
              onClick(mark);
          });
       }
  }

  static createDashedLine(g: d3.Selection<SVGGElement, unknown, null, undefined>, 
    x: number, y: number, h: number) {
    
      g.append("line")
      .attr("x1", x)
      .attr("y1", h)
      .attr("x2", x)
      .attr("y2", y)
      .attr("stroke", "black")
      .attr("stroke-dasharray", "3 3")
      .attr("stroke-width", 1);
  }

  static createSolidLine(g: d3.Selection<SVGGElement, unknown, null, undefined>, x: number, y1: number, y2: number) {
    
    g.append("line")
      .attr("x1", x)
      .attr("y1", y1)
      .attr("x2", x)
      .attr("y2", y2)
      .attr("stroke", "white")
      .attr("stroke-width", 3);
  }

  static createMetaText(g: d3.Selection<SVGGElement, unknown, null, undefined>, text: string, isArrival: boolean, isAltitude: boolean, w: number) {
    
    const x = isArrival ? w + 15 : -15;
    const y = isAltitude ? 0 : -25;
    const anchor = isArrival ? "end" : "start";
    const fontSize = isAltitude ? "16px" : "22px";

    g.append("text")
      .attr("x", x)
      .attr("y", y)
      .style("text-anchor", anchor)
      .style("dominant-baseline", "middle")
      .style("fill", "white")
      .style("font-weight", "bold")
      .style("font-size", fontSize)
      .text(text);
  }

  static createStartSymbol(g: d3.Selection<SVGGElement, unknown, null, undefined>) {

    g.append("circle")
      .attr("cx", 0)
      .attr("cy", 35)
      .attr("r", 20)
      .attr("fill", "blue");

    g.append("polygon")
      .attr("points", "-6,-9 10,0 -6,9") 
      .attr("transform", "translate(0,35)") 
      .attr("fill", "white");
  }

  static createEndSymbol(g: d3.Selection<SVGGElement, unknown, null, undefined>, w: number) {
    
    g.append("circle")
      .attr("cx", w)
      .attr("cy", 35)
      .attr("r", 20)
      .attr("fill", "red");
      
    const xOffsets = [-9, 3];
    for (let i = 0; i < 3; i++) {
      const y = 26 + i * 6;
      const rowX = i % 2 === 0 ? xOffsets : [-3];
      rowX.forEach(xOffset => {
        g.append("rect")
          .attr("x", w + xOffset)
          .attr("y", y)
          .attr("width", 6)
          .attr("height", 6)
          .attr("fill", "white")
      });
    }

    g.append("circle")
      .attr("cx", w)
      .attr("cy", 35)
      .attr("r", 10)
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-width", 3);

    g.append("circle")
      .attr("cx", w)
      .attr("cy", 35)
      .attr("r", 14)
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-width", 6);
  }
}