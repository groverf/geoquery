import java.io.*;
import java.util.*;
import java.util.regex.*;

/*
 * Compiles a list of prefixes from a Parliament data set.
 * 
 * Usage:
 * 1. Use the Parliament Export Data / Export Repository function to download
 *    an .nt file to the file listed below.
 * 2. Execute PrefixFinder.
 */
public class PrefixFinder {
 
  private static final String parliamentExportName = "/Users/groverf/Desktop/Default Graph.nt";
  
  private static final String pattern1 = "<[^<>]*>",
    pattern2 = "\"[^\"]*\"",
    pattern3 = pattern2 + "\\^\\^" + pattern1,
    combinedPattern = pattern1 + " " + "|" + pattern2 + " " + "|" + pattern3;
  private static final Pattern pattern = Pattern.compile(combinedPattern);
  
  /*
   * Run the prefix finder.
   */
  public static void main(String[] args) {
    //testPatterns();
    (new PrefixFinder()).run();
  } // end main()
  
  /*
   * Test the patterns by matching them against test literals. All should
   * return true;
   */
  private static void testPatterns() {
    System.out.println( Pattern.matches(pattern1, "<http://lskjd/sldkfj#lsdjf>") );
    System.out.println( Pattern.matches(pattern2, "\"..blah blah ^^##**&& blah .\"") );
    System.out.println( Pattern.matches(pattern3, "\".. .\"^^<  >") );
    System.out.println( Pattern.matches(combinedPattern, "<http://lskjd/sldkfj#lsdjf>") );
    System.out.println( Pattern.matches(combinedPattern, "\"..blah blah ^^##**&& blah .\"") );
    System.out.println( Pattern.matches(combinedPattern, "\".. .\"^^<  >") );
  } // end testPatterns()
  
  /*
   * Start the search process. 
   * 
   * Each line of the input file is passed to addPrefixes, which finds any
   * prefixes that it contains and adds them to the list, if not already there.
   * 
   * The list is displayed before the procedure ends.
   */
  public void run() {
    ArrayList<String> prefixes = new ArrayList<String>();
    BufferedReader inFile;
    String inLine;
    int lineCount = 0;
    
    try {
      inFile = new BufferedReader(new FileReader(new File(parliamentExportName)));
      while ( (inLine = inFile.readLine()) != null) {
        lineCount++;
        addPrefixes(inLine, prefixes);
        //if (lineCount > 10) break;
      }
      inFile.close();
    }
    catch (IOException ioe) {
      ioe.printStackTrace();
    }

    System.out.println(
        "Summary:"
      + "  input lines: " + lineCount
      + "  prefixes: " + prefixes.size()
      );
    
    // output the prefixes as an HTML unordered list
    System.out.println("<ul>");
    for (int i=0; i<prefixes.size(); i++) {
      System.out.println("<li>PREFIX &lt;" + prefixes.get(i) + "&gt;</li>");
    }
    System.out.println("</ul>");
    
  } // end run()
  
  /*
   * Add all prefixes found in inLine to the list of prefixes.
   */
  private void addPrefixes(String inLine, ArrayList<String> prefixes) {
    //System.out.println(inLine);
    String prefix;
    
    String[] terms = inLine.split(" ");
    
    for (int i=0; i<terms.length; i++) {
      if (Pattern.matches(pattern1, terms[i])) {
        if (terms[i].lastIndexOf("#") != -1) {
          prefix = terms[i].substring(1,terms[i].lastIndexOf("#")+1);
        }
        else {
          prefix = terms[i].substring(1,terms[i].lastIndexOf("/")+1);
        }
        //System.out.println(terms[i] + " " + prefix); 
        
        if (! prefixes.contains(prefix)) {
          prefixes.add(prefix);
        }
      }
    }
  } // end addPrefixes()
  
}  // end PrefixFinder