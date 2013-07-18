
import java.io.*;

/**
 * Reads an N3 file (assumed to be sorted) and reports on redundancies.
 *
 * @author groverf
 */
public class RedundancyFinder {

  public static void main(String[] args) {
    int linesIn = 0, linesOut = 0;
    String inFileName = "sortdata.N3", outFileName = "cleandata.N3";
    String inLine, priorLine = null;

    try {
      BufferedReader inFile = new BufferedReader(new FileReader(new File(inFileName)));
      PrintWriter outFile = new PrintWriter(new File(outFileName));

      do {
        inLine = inFile.readLine();
        if (inLine != null) {
          linesIn++;
          
          if (priorLine != null && inLine.equals(priorLine) ) {
            System.out.println("duplicate: " + inLine);
          }
          else {
            outFile.println(inLine);
            linesOut++;
            priorLine = inLine;
          }
        }
      } while (inLine != null);

      inFile.close();
      outFile.close();
    } catch (IOException ioe) {
      ioe.printStackTrace();
    }
    
    System.out.println("Lines in: " + linesIn + "   out: " + linesOut);
  }
}
