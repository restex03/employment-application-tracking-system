using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text.RegularExpressions;
using AngleSharp.Svg.Dom;
using Eats.Ingestion.Application.JobPostSync;
using Microsoft.VisualStudio.TestPlatform.ObjectModel.Client;
using Xunit;

namespace Eats.Ingestion.Tests.Application.JobPostSync;

/// <summary>
/// Real, distinct location values sampled from job-post-locations.csv.
/// Tests the location allow-list in isolation, not ScreenJobPost's role logic.
/// </summary>
public sealed class JobPostScreenerLocationTests
{
  
    
    public static TheoryData<string> AllowedLocations => new()
    {
        "Atlanta, GA",
        "ATLANTA, GA, USA",
        "Atlanta, Georgia",
        "STORE SUPPORT CENTER, ATLANTA - 9090",
        "GA Atlanta 1050 Techwood Drive NW",
        "Alpharetta, GA",
        "Alpharetta, Georgia, United States of America",
        "GA-Atlanta",
        "USA - Georgia - Alpharetta - 30005",
        "ALPHARETTA, GEORGIA",
        "US - GA - Atlanta",
        "USA - Atlanta - Georgia",
        "Atlanta GA",
        "USA, GA, Atlanta",
        "Atlanta, GA, US",
        "Alpharetta, Georgia",
        "US - GA, Atlanta",
        "ATL1 - Atlanta, GA",
        "Atlanta, GA, United States",
        "HQ - Atlanta, GA",
        "GA - Atlanta",
        "USA - Kennesaw, GA",
        "Georgia - Atlanta",
        "Atlanta, Georgia, USA",
        "GA-Atlanta Kendall Park",
        "Atlanta, Georgia, US",
        "US-Alpharetta, GA",
        "USA-GA-Alpharetta-JVW3",
        "USA-Atlanta, GA",
        "Atlanta, GA, USA",
        "USA GA - Atlanta - Corporate Center V, 5 Concourse Parkway, Suite 2300",
        "Atlanta GA - 303 Peachtree Center Avenue - Garden Offices",
        "Kennesaw, GA, USA",
        "Atlanta, Georgia Office",
        "USA - Remote",
        "Any Location / Remote",
        "US - Remote",
        "US - Remote (Any location)",
        "Remote-USA",
        "Remote",
        "United States - Remote",
        "Remote, USA",
        "Remote, United States",
        "Remote - USA",
        "Remote Nationwide",
        "6314 Remote/Teleworker US",
        "Remote - Anywhere - USA",
        "United States-Remote",
        "Nationwide Remote",
        "Remote, US",
        "Remote (US Only)",
        "Remote - US",
        "Remote- US",
        "US, Remote",
        "Work from Home, United States",
        "NULL",
        "Georgia",
        "2 Locations",
        "3 Locations",
        "4 Locations",
        "5 Locations",
        "6 Locations",
        "7 Locations",
        "8 Locations",
        "9 Locations",
        "10 Locations",
        "11 Locations",
        "12 Locations",
        "49 Locations",
        "63 Locations",
        "66 Locations",
        "Georgia - Remote",
        "Remote - Georgia",
    };

    public static TheoryData<string> RejectedLocations => new()
    {
        "IN, BANGALORE",
        "US, Minnesota, Maplewood",
        "Remote - California",
        "IN, Maharashtra, Pune",
        "AUSTIN",
        "SAN JOSE",
        "PETAH TIKVA 01",
        "PENANG 02",
        "MX, San Luis Potosi Sl",
        "NOIDA",
        "NAGOYA 02",
        "Milford, Michigan, United States of America",
        "Austin, Texas, United States of America",
        "Guangzhou",
        "Singapore",
        "Limerick, Ireland",
        "US, CA, Santa Clara",
        "Bengaluru, Karnātaka, India",
        "McLean, VA",
        "Pune, India",
        "Boise, ID - Main Site",
        "Huntsville, AL",
        "Milpitas, CA",
        "Chantilly, VA",
        "O'Fallon, Missouri",
        "(USA) Crossman Respect Building CA SUNNYVALE Home Office",
        "Annapolis Junction, MD",
        "New York, NY",
        "Plano, TX",
        "Pune, Gera Commerzone SEZ",
        "Warren, Michigan, United States of America",
        "Sunnyvale, California, United States of America",
        "Santa Clara,CA",
        "Chicago, IL",
        "Buffalo, NY",
        "Sterling, VA",
        "United States-California-San Diego",
        "Arlington, VA",
        "Bethesda, MD",
        "Bengaluru, India - Remote",
        "USA - IL (Remote)",
        "US, CA, Remote",
        "Illinois Remote Work, More...",
        "Brazil - Remote",
        "BR - Remote - Brazil",
        "UK, Remote",
        "Mexico - Remote",
        "OH-Ohio-Work from Home",
        "United Kingdom - Remote",
        "US-TX-REMOTE",
        "Work from Home, Bulgaria",
        "CAN - ON GTA (Remote)",
        "Ontario Remote Work, More...",
        "CO - Work from home",
        "Poland - Remote",
        "Canada - Remote",
        "Remote Australia",
        "REMOTE, , LONDON",
        "Remote-CA",
        "Singapore, Remote",
        "Remote UK",
        "Remote (United Kingdom)",
        "Japan - Tokyo - Remote",
        "Canada - Toronto, Remote",
        "Minnesota Remote",
        "Florida Remote Work, More...",
        "California - Remote",
        "Remote, Canada",
        "GBR-London-Remote",
        "Work from Home, United Kingdom",
        "Remote Netherlands",
        "US-CA-REMOTE",
        "US, WA, Remote",
        "US, TN, Remote",
        "US-NY-REMOTE",
        "Remote - Utah",
        "USA - AZ (Remote)",
        "Japan, Remote",
        "Remote Washington",
        "Remote Illinois",
        "Remote Alberta",
        "Remote Massachusetts",
        "Germany-Remote Location",
        "Remote Worker Location, Sweden",
        "Work from Home, EMEA",
        "United States-Georgia-Warner Robins",
        "Augusta, Georgia",
        "United States-Georgia-Unknown City",
    };

    [Theory]
    [MemberData(nameof(AllowedLocations))]
    public void LocationPassList_AllowsEligibleOrAmbiguousCsvLocation(string location)
    {
        var data = new LocationCriteria(location);
        var sut = new LocationScreener();
        Assert.True(sut.IsSatisfiedBy(data), $"Expected location to pass: {location}");
    }
        

    [Theory]
    [MemberData(nameof(RejectedLocations))]
    public void LocationPassList_RejectsOutOfAreaCsvLocation(string location)
    {
        var data = new LocationCriteria(location);
        var sut = new LocationScreener();
        Assert.False(sut.IsSatisfiedBy(data), $"Expected location to fail: {location}");
    }
        

    [Theory]
    [InlineData("2 Locations")]
    [InlineData("10 Locations")]
    [InlineData("66 Locations")]
    [InlineData("100 Locations")]
    [InlineData("1 Location")]
    public void LocationPassList_AllowsUnresolvedLocationCounts(string location)
    {
        var data = new LocationCriteria(location);
        var sut = new LocationScreener();
        Assert.True(sut.IsSatisfiedBy(data));
    }
        

    [Theory]
    [InlineData("Atlanta; Hyderabad, India")]
    [InlineData("Hyderabad, India; Atlanta, GA")]
    [InlineData("Alpharetta, GA / Bengaluru, India")]
    public void LocationPassList_AllowsMultipleLocationsWhenOneIsEligible(string location) {
        var data = new LocationCriteria(location);
        var sut = new LocationScreener();
        Assert.True(sut.IsSatisfiedBy(data));
    }

    private class LocationCriteria(string location) : IJobPostScreenCriteria
    {
        public string Location { get; set; } = location;

        public string Title => "NO_OP";
        public string DetailPath => "NO_OP";
    }
}

